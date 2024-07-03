import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {useTheme} from '@emotion/react';
import {Replayer, ReplayerEvents} from '@sentry-internal/rrweb';

import type {
  PrefsStrategy,
  ReplayPrefs,
} from 'sentry/components/replays/preferences/replayPreferences';
import useReplayHighlighting from 'sentry/components/replays/useReplayHighlighting';
import {VideoReplayerWithInteractions} from 'sentry/components/replays/videoReplayerWithInteractions';
import {trackAnalytics} from 'sentry/utils/analytics';
import clamp from 'sentry/utils/number/clamp';
import type useInitialOffsetMs from 'sentry/utils/replays/hooks/useInitialTimeOffsetMs';
import useRAF from 'sentry/utils/replays/hooks/useRAF';
import {replayPlayerTimestampEmitter} from 'sentry/utils/replays/replayPlayerTimestampEmitter';
import type ReplayReader from 'sentry/utils/replays/replayReader';
import useOrganization from 'sentry/utils/useOrganization';
import usePrevious from 'sentry/utils/usePrevious';
import useProjectFromId from 'sentry/utils/useProjectFromId';
import {useUser} from 'sentry/utils/useUser';

import {CanvasReplayerPlugin} from './canvasReplayerPlugin';

type Dimensions = {height: number; width: number};
type RootElem = null | HTMLDivElement;

type HighlightCallbacks = ReturnType<typeof useReplayHighlighting>;

// Important: Don't allow context Consumers to access `Replayer` directly.
// It has state that, when changed, will not trigger a react render.
// Instead only expose methods that wrap `Replayer` and manage state.
interface ReplayPlayerContextProps extends HighlightCallbacks {
  /**
   * The context in which the replay is being viewed.
   */
  analyticsContext: string;

  /**
   * The time, in milliseconds, where the user focus is.
   * The user focus can be reported by any collaborating object, usually on
   * hover.
   */
  currentHoverTime: undefined | number;

  /**
   * The current time of the video, in milliseconds
   * The value is updated on every animation frame, about every 16.6ms
   */
  currentTime: number;

  /**
   * Original dimensions in pixels of the captured browser window
   */
  dimensions: Dimensions;

  /**
   * The calculated speed of the player when fast-forwarding through idle moments in the video
   * The value is set to `0` when the video is not fast-forwarding
   * The speed is automatically determined by the length of each idle period
   */
  fastForwardSpeed: number;

  /**
   * Set to true while the library is reconstructing the DOM
   */
  isBuffering: boolean;

  /**
   * Is the data inside the `replay` complete, or are we waiting for more.
   */
  isFetching;

  /**
   * Set to true when the replay finish event is fired
   */
  isFinished: boolean;

  /**
   * Whether the video is currently playing
   */
  isPlaying: boolean;

  /**
   * Whether fast-forward mode is enabled if RRWeb detects idle moments in the video
   */
  isSkippingInactive: boolean;

  /**
   * Set to true while the current video is loading (this is used
   * only for video replays and in lieu of `isBuffering`)
   */
  isVideoBuffering: boolean;

  /**
   * Whether the replay is considered a video replay
   */
  isVideoReplay: boolean;

  /**
   * The core replay data
   */
  replay: ReplayReader | null;

  /**
   * Restart the replay
   */
  restart: () => void;

  /**
   * Set the currentHoverTime so collaborating components can highlight related
   * information
   */
  setCurrentHoverTime: (time: undefined | number) => void;

  /**
   * Jump the video to a specific time
   */
  setCurrentTime: (time: number) => void;

  /**
   * Required to be called with a <div> Ref
   * Represents the location in the DOM where the iframe video should be mounted
   *
   * @param root
   */
  setRoot: (root: RootElem) => void;

  /**
   * Set speed for normal playback
   */
  setSpeed: (speed: number) => void;

  /**
   * The speed for normal playback
   */
  speed: number;

  /**
   * Start or stop playback
   *
   * @param play
   */
  togglePlayPause: (play: boolean) => void;
  /**
   * Allow RRWeb to use Fast-Forward mode for idle moments in the video
   *
   * @param skip
   */
  toggleSkipInactive: (skip: boolean) => void;
}

const ReplayPlayerContext = createContext<ReplayPlayerContextProps>({
  analyticsContext: '',
  clearAllHighlights: () => {},
  currentHoverTime: undefined,
  currentTime: 0,
  dimensions: {height: 0, width: 0},
  fastForwardSpeed: 0,
  addHighlight: () => {},
  isBuffering: false,
  isVideoBuffering: false,
  isFetching: false,
  isFinished: false,
  isPlaying: false,
  isVideoReplay: false,
  isSkippingInactive: true,
  removeHighlight: () => {},
  replay: null,
  restart: () => {},
  setCurrentHoverTime: () => {},
  setCurrentTime: () => {},
  setRoot: () => {},
  setSpeed: () => {},
  speed: 1,
  togglePlayPause: () => {},
  toggleSkipInactive: () => {},
});

type Props = {
  /**
   * The context in which the replay is being viewed.
   * Attached to certain analytics events.
   */
  analyticsContext: string;

  children: React.ReactNode;

  /**
   * Is the data inside the `replay` complete, or are we waiting for more.
   */
  isFetching: boolean;

  /**
   * The strategy for saving/loading preferences, like the playback speed
   */
  prefsStrategy: PrefsStrategy;

  replay: ReplayReader | null;

  /**
   * Start the video as soon as it's ready
   */
  autoStart?: boolean;

  /**
   * Time, in seconds, when the video should start
   */
  initialTimeOffsetMs?: ReturnType<typeof useInitialOffsetMs>;

  /**
   * Override return fields for testing
   */
  value?: Partial<ReplayPlayerContextProps>;
};

function useCurrentTime(callback: () => number) {
  const [currentTime, setCurrentTime] = useState(0);
  useRAF(() => setCurrentTime(callback));
  return currentTime;
}

export function Provider({
  analyticsContext,
  children,
  initialTimeOffsetMs,
  isFetching,
  prefsStrategy,
  replay,
  autoStart,
  value = {},
}: Props) {
  const user = useUser();
  const organization = useOrganization();
  const projectSlug = useProjectFromId({
    project_id: replay?.getReplay().project_id,
  })?.slug;
  const events = replay?.getRRWebFrames();
  const savedReplayConfigRef = useRef<ReplayPrefs>(prefsStrategy.get());

  const theme = useTheme();
  const oldEvents = usePrevious(events);
  // Note we have to check this outside of hooks, see `usePrevious` comments
  const hasNewEvents = events !== oldEvents;
  const replayerRef = useRef<Replayer>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({height: 0, width: 0});
  const [currentHoverTime, setCurrentHoverTime] = useState<undefined | number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [finishedAtMS, setFinishedAtMS] = useState<number>(-1);
  const [isSkippingInactive, setIsSkippingInactive] = useState(
    savedReplayConfigRef.current.isSkippingInactive
  );
  const [speed, setSpeedState] = useState(savedReplayConfigRef.current.playbackSpeed);
  const [fastForwardSpeed, setFFSpeed] = useState(0);
  const [buffer, setBufferTime] = useState({target: -1, previous: -1});
  const [isVideoBuffering, setVideoBuffering] = useState(false);
  const playTimer = useRef<number | undefined>(undefined);
  const didApplyInitialOffset = useRef(false);
  const [rootEl, setRoot] = useState<HTMLDivElement | null>(null);

  const durationMs = replay?.getDurationMs() ?? 0;
  const clipWindow = replay?.getClipWindow() ?? undefined;
  const startTimeOffsetMs = replay?.getStartOffsetMs() ?? 0;
  const videoEvents = replay?.getVideoEvents();
  const startTimestampMs = replay?.getStartTimestampMs();
  const isVideoReplay = Boolean(
    organization.features.includes('session-replay-mobile-player') && videoEvents?.length
  );

  const forceDimensions = (dimension: Dimensions) => {
    setDimensions(dimension);
  };
  const onFastForwardStart = useCallback((e: {speed: number}) => {
    if (savedReplayConfigRef.current.isSkippingInactive) {
      setFFSpeed(e.speed);
    }
  }, []);
  const onFastForwardEnd = () => {
    setFFSpeed(0);
  };

  const {addHighlight, clearAllHighlights, removeHighlight} = useReplayHighlighting({
    replayerRef,
  });

  const getCurrentPlayerTime = useCallback(
    () => (replayerRef.current ? Math.max(replayerRef.current.getCurrentTime(), 0) : 0),
    []
  );

  const isFinished = getCurrentPlayerTime() === finishedAtMS;
  const setReplayFinished = useCallback(() => {
    setFinishedAtMS(getCurrentPlayerTime());
    setIsPlaying(false);
  }, [getCurrentPlayerTime]);

  const privateSetCurrentTime = useCallback(
    (requestedTimeMs: number) => {
      const replayer = replayerRef.current;
      if (!replayer) {
        return;
      }

      const skipInactive = replayer.config.skipInactive;

      if (skipInactive) {
        // If the replayer is set to skip inactive, we should turn it off before
        // manually scrubbing, so when the player resumes playing it's not stuck
        // fast-forwarding even through sections with activity
        replayer.setConfig({skipInactive: false});
      }

      const time = clamp(requestedTimeMs, 0, startTimeOffsetMs + durationMs);

      // Sometimes rrweb doesn't get to the exact target time, as long as it has
      // changed away from the previous time then we can hide then buffering message.
      setBufferTime({target: time, previous: getCurrentPlayerTime()});

      // Clear previous timers. Without this (but with the setTimeout) multiple
      // requests to set the currentTime could finish out of order and cause jumping.
      if (playTimer.current) {
        window.clearTimeout(playTimer.current);
      }

      replayer.setConfig({skipInactive});

      if (isPlaying) {
        playTimer.current = window.setTimeout(() => replayer.play(time), 0);
        setIsPlaying(true);
      } else {
        playTimer.current = window.setTimeout(() => replayer.pause(time), 0);
        setIsPlaying(false);
      }
    },
    [startTimeOffsetMs, durationMs, getCurrentPlayerTime, isPlaying]
  );

  const setCurrentTime = useCallback(
    (requestedTimeMs: number) => {
      privateSetCurrentTime(requestedTimeMs + startTimeOffsetMs);
      clearAllHighlights();
    },
    [privateSetCurrentTime, startTimeOffsetMs, clearAllHighlights]
  );

  const applyInitialOffset = useCallback(() => {
    const offsetMs = (initialTimeOffsetMs?.offsetMs ?? 0) + startTimeOffsetMs;

    if (
      !didApplyInitialOffset.current &&
      (initialTimeOffsetMs || offsetMs) &&
      events &&
      replayerRef.current
    ) {
      const highlightArgs = initialTimeOffsetMs?.highlight;
      if (offsetMs > 0) {
        privateSetCurrentTime(offsetMs);
      }
      if (highlightArgs) {
        addHighlight(highlightArgs);
        setTimeout(() => {
          clearAllHighlights();
          addHighlight(highlightArgs);
        });
      }
      if (autoStart) {
        setTimeout(() => {
          replayerRef.current?.play(offsetMs);
          setIsPlaying(true);
        });
      }
      didApplyInitialOffset.current = true;
    }
  }, [
    clearAllHighlights,
    events,
    addHighlight,
    initialTimeOffsetMs,
    privateSetCurrentTime,
    startTimeOffsetMs,
    autoStart,
  ]);

  useEffect(clearAllHighlights, [clearAllHighlights, isPlaying]);

  const initRoot = useCallback(
    (root: RootElem) => {
      if (events === undefined || root === null || isFetching) {
        return;
      }

      if (replayerRef.current) {
        if (!hasNewEvents) {
          return;
        }

        if (replayerRef.current.iframe.contentDocument?.body.childElementCount === 0) {
          // If this is true, then no need to clear old iframe as nothing was rendered
          return;
        }

        // We have new events, need to clear out the old iframe because a new
        // `Replayer` instance is about to be created
        while (root.firstChild) {
          root.removeChild(root.firstChild);
        }
      }

      // eslint-disable-next-line no-new
      const inst = new Replayer(events, {
        root,
        blockClass: 'sentry-block',
        mouseTail: {
          duration: 0.75 * 1000,
          lineCap: 'round',
          lineWidth: 2,
          strokeStyle: theme.purple200,
        },
        plugins: organization.features.includes('session-replay-enable-canvas-replayer')
          ? [CanvasReplayerPlugin(events)]
          : [],
        skipInactive: savedReplayConfigRef.current.isSkippingInactive,
        speed: savedReplayConfigRef.current.playbackSpeed,
      });

      // @ts-expect-error: rrweb types event handlers with `unknown` parameters
      inst.on(ReplayerEvents.Resize, forceDimensions);
      inst.on(ReplayerEvents.Finish, setReplayFinished);
      // @ts-expect-error: rrweb types event handlers with `unknown` parameters
      inst.on(ReplayerEvents.SkipStart, onFastForwardStart);
      inst.on(ReplayerEvents.SkipEnd, onFastForwardEnd);

      // `.current` is marked as readonly, but it's safe to set the value from
      // inside a `useEffect` hook.
      // See: https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
      // @ts-expect-error
      replayerRef.current = inst;

      applyInitialOffset();
    },
    [
      applyInitialOffset,
      events,
      hasNewEvents,
      isFetching,
      organization.features,
      setReplayFinished,
      theme.purple200,
      onFastForwardStart,
    ]
  );

  const initVideoRoot = useCallback(
    (root: RootElem) => {
      if (root === null || isFetching) {
        return null;
      }

      // check if this is a video replay and if we can use the video (wrapper) replayer
      if (!isVideoReplay || !videoEvents || !startTimestampMs) {
        return null;
      }

      // This is a wrapper class that wraps both the VideoReplayer
      // and the rrweb Replayer
      const inst = new VideoReplayerWithInteractions({
        // video specific
        videoEvents,
        videoApiPrefix: `/api/0/projects/${
          organization.slug
        }/${projectSlug}/replays/${replay?.getReplay().id}/videos/`,
        start: startTimestampMs,
        onFinished: setReplayFinished,
        onLoaded: event => {
          const {videoHeight, videoWidth} = event.target;
          if (!videoHeight || !videoWidth) {
            return;
          }
          setDimensions({
            height: videoHeight,
            width: videoWidth,
          });
        },
        onBuffer: buffering => {
          setVideoBuffering(buffering);
        },
        clipWindow,
        durationMs,
        speed: savedReplayConfigRef.current.playbackSpeed,
        // rrweb specific
        theme,
        events: events ?? [],
        // common to both
        root,
      });
      // `.current` is marked as readonly, but it's safe to set the value from
      // inside a `useEffect` hook.
      // See: https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
      // @ts-expect-error
      replayerRef.current = inst;
      applyInitialOffset();
      return inst;
    },
    [
      applyInitialOffset,
      isFetching,
      isVideoReplay,
      videoEvents,
      events,
      organization.slug,
      projectSlug,
      replay,
      setReplayFinished,
      startTimestampMs,
      clipWindow,
      durationMs,
      theme,
    ]
  );

  const setSpeed = useCallback(
    (newSpeed: number) => {
      const replayer = replayerRef.current;
      savedReplayConfigRef.current = {
        ...savedReplayConfigRef.current,
        playbackSpeed: newSpeed,
      };

      prefsStrategy.set(savedReplayConfigRef.current);

      if (!replayer) {
        return;
      }
      if (isPlaying) {
        replayer.pause();
        replayer.setConfig({speed: newSpeed});
        replayer.play(getCurrentPlayerTime());
      } else {
        replayer.setConfig({speed: newSpeed});
      }

      setSpeedState(newSpeed);
    },
    [prefsStrategy, getCurrentPlayerTime, isPlaying]
  );

  const togglePlayPause = useCallback(
    (play: boolean) => {
      const replayer = replayerRef.current;
      if (!replayer) {
        return;
      }

      if (play) {
        replayer.play(getCurrentPlayerTime());
      } else {
        replayer.pause(getCurrentPlayerTime());
      }
      setIsPlaying(play);

      trackAnalytics('replay.play-pause', {
        organization,
        user_email: user.email,
        play,
        context: analyticsContext,
      });
    },
    [organization, user.email, analyticsContext, getCurrentPlayerTime]
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' && replayerRef.current) {
        togglePlayPause(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [togglePlayPause]);

  // Initialize replayer for Video Replays
  useEffect(() => {
    const instance =
      isVideoReplay && rootEl && !replayerRef.current && initVideoRoot(rootEl);

    return () => {
      if (instance && !rootEl) {
        instance.destroy();
      }
    };
  }, [rootEl, isVideoReplay, initVideoRoot, videoEvents]);

  // For non-video (e.g. rrweb) replays, initialize the player
  useEffect(() => {
    if (!isVideoReplay && events) {
      if (replayerRef.current) {
        // If it's already been initialized, we still call initRoot, which
        // should clear out existing dom element
        initRoot(replayerRef.current.wrapper.parentElement as RootElem);
      } else if (rootEl) {
        initRoot(rootEl);
      }
    }
  }, [rootEl, initRoot, events, isVideoReplay]);

  // Clean-up rrweb replayer when root element is unmounted
  useEffect(() => {
    return () => {
      if (rootEl && replayerRef.current) {
        replayerRef.current.destroy();
        // @ts-expect-error Cleaning up
        replayerRef.current = null;
      }
    };
  }, [rootEl]);

  const restart = useCallback(() => {
    if (replayerRef.current) {
      replayerRef.current.play(startTimeOffsetMs);
      setIsPlaying(true);
    }
  }, [startTimeOffsetMs]);

  const toggleSkipInactive = useCallback(
    (skip: boolean) => {
      const replayer = replayerRef.current;
      savedReplayConfigRef.current = {
        ...savedReplayConfigRef.current,
        isSkippingInactive: skip,
      };

      prefsStrategy.set(savedReplayConfigRef.current);

      if (!replayer) {
        return;
      }
      if (skip !== replayer.config.skipInactive) {
        replayer.setConfig({skipInactive: skip});
      }

      setIsSkippingInactive(skip);
    },
    [prefsStrategy]
  );

  const currentPlayerTime = useCurrentTime(getCurrentPlayerTime);

  const [isBuffering, currentBufferedPlayerTime] =
    buffer.target !== -1 &&
    buffer.previous === currentPlayerTime &&
    buffer.target !== buffer.previous
      ? [true, buffer.target]
      : [false, currentPlayerTime];

  const currentTime = currentBufferedPlayerTime - startTimeOffsetMs;

  useEffect(() => {
    if (!isBuffering && events && events.length >= 2 && replayerRef.current) {
      applyInitialOffset();
    }
  }, [isBuffering, events, applyInitialOffset]);

  useLayoutEffect(() => {
    replayPlayerTimestampEmitter.emit('replay timestamp change', {
      currentTime,
      currentHoverTime,
    });
  }, [currentTime, currentHoverTime]);

  useEffect(() => {
    if (!isBuffering && buffer.target !== -1) {
      setBufferTime({target: -1, previous: -1});
    }
  }, [isBuffering, buffer.target]);

  return (
    <ReplayPlayerContext.Provider
      value={{
        analyticsContext,
        clearAllHighlights,
        currentHoverTime,
        currentTime,
        dimensions,
        fastForwardSpeed,
        addHighlight,
        setRoot,
        isBuffering: isBuffering && !isVideoReplay,
        isVideoBuffering,
        isFetching,
        isVideoReplay,
        isFinished,
        isPlaying,
        isSkippingInactive,
        removeHighlight,
        replay,
        restart,
        setCurrentHoverTime,
        setCurrentTime,
        setSpeed,
        speed,
        togglePlayPause,
        toggleSkipInactive,
        ...value,
      }}
    >
      {children}
    </ReplayPlayerContext.Provider>
  );
}

export const useReplayContext = () => useContext(ReplayPlayerContext);
