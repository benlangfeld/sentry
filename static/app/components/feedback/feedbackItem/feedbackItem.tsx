import {Fragment} from 'react';
import styled from '@emotion/styled';

import ErrorBoundary from 'sentry/components/errorBoundary';
import ActivitySection from 'sentry/components/feedback/feedbackItem/activitySection';
import CrashReportSection from 'sentry/components/feedback/feedbackItem/crashReportSection';
import FeedbackItemHeader from 'sentry/components/feedback/feedbackItem/feedbackItemHeader';
import Section from 'sentry/components/feedback/feedbackItem/feedbackItemSection';
import FeedbackViewers from 'sentry/components/feedback/feedbackItem/feedbackViewers';
import ReplaySection from 'sentry/components/feedback/feedbackItem/replaySection';
import TagsSection from 'sentry/components/feedback/feedbackItem/tagsSection';
import PanelItem from 'sentry/components/panels/panelItem';
import {Flex} from 'sentry/components/profiling/flex';
import TextCopyInput from 'sentry/components/textCopyInput';
import {IconChat, IconFire, IconLink, IconPlay, IconTag} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {Event, Group} from 'sentry/types';
import type {FeedbackIssue} from 'sentry/utils/feedback/types';
import useReplayCountForFeedbacks from 'sentry/utils/replayCount/useReplayCountForFeedbacks';
import useOrganization from 'sentry/utils/useOrganization';

interface Props {
  eventData: Event | undefined;
  feedbackItem: FeedbackIssue;
  tags: Record<string, string>;
}

export default function FeedbackItem({feedbackItem, eventData, tags}: Props) {
  const organization = useOrganization();
  const {feedbackHasReplay} = useReplayCountForFeedbacks();
  const hasReplayId = feedbackHasReplay(feedbackItem.id);

  const url = eventData?.tags.find(tag => tag.key === 'url');
  const replayId = eventData?.contexts?.feedback?.replay_id;
  const crashReportId = eventData?.contexts?.feedback?.associated_event_id;

  return (
    <Fragment>
      <FeedbackItemHeader eventData={eventData} feedbackItem={feedbackItem} />
      <OverflowPanelItem>
        <Section
          title={t('Description')}
          contentRight={
            <Flex gap={space(1)} align="center">
              <SmallTitle>{t('Viewers')}</SmallTitle>
              <FeedbackViewers feedbackItem={feedbackItem} />
            </Flex>
          }
        >
          <Blockquote>
            <pre>{feedbackItem.metadata.message}</pre>
          </Blockquote>
        </Section>

        <Section icon={<IconLink size="xs" />} title={t('URL')}>
          <TextCopyInput size="sm">
            {eventData?.tags ? (url ? url.value : t('URL not found')) : ''}
          </TextCopyInput>
        </Section>

        {crashReportId && (
          <Section icon={<IconFire size="xs" />} title={t('Linked Error')}>
            <ErrorBoundary mini>
              <CrashReportSection
                organization={organization}
                crashReportId={crashReportId}
                projectSlug={feedbackItem.project.slug}
              />
            </ErrorBoundary>
          </Section>
        )}

        {hasReplayId && replayId && (
          <Section icon={<IconPlay size="xs" />} title={t('Linked Replay')}>
            <ErrorBoundary mini>
              <ReplaySection
                eventTimestampMs={new Date(feedbackItem.firstSeen).getTime()}
                organization={organization}
                replayId={replayId}
              />
            </ErrorBoundary>
          </Section>
        )}

        <Section icon={<IconTag size="xs" />} title={t('Tags')}>
          <TagsSection tags={tags} />
        </Section>

        <Section icon={<IconChat size="xs" />} title={t('Activity')}>
          <ActivitySection group={feedbackItem as unknown as Group} />
        </Section>
      </OverflowPanelItem>
    </Fragment>
  );
}

const OverflowPanelItem = styled(PanelItem)`
  overflow: scroll;

  flex-direction: column;
  flex-grow: 1;
  gap: ${space(4)};
`;

const SmallTitle = styled('span')`
  font-size: ${p => p.theme.fontSizeRelativeSmall};
`;

const Blockquote = styled('blockquote')`
  margin: 0 ${space(4)};
  position: relative;

  &::before {
    position: absolute;
    color: ${p => p.theme.purple300};
    content: '❝';
    font-size: ${space(4)};
    left: -${space(4)};
    top: -0.4rem;
  }
  &::after {
    position: absolute;
    border: 1px solid ${p => p.theme.purple300};
    bottom: 0;
    content: '';
    left: -${space(1)};
    top: 0;
  }

  & > pre {
    margin: 0;
    background: none;
    font-family: inherit;
    font-size: ${p => p.theme.fontSizeMedium};
    line-height: 1.6;
    padding: 0;
    word-break: break-word;
  }
`;
