import moment from 'moment';

import {useDiscoverQuery} from 'sentry/utils/discover/discoverQuery';
import EventView, {encodeSort} from 'sentry/utils/discover/eventView';
import {
  DiscoverQueryProps,
  useGenericDiscoverQuery,
} from 'sentry/utils/discover/genericDiscoverQuery';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';

export const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';

// Setting return type since I'd rather not know if its discover query or not
export type UseSpansQueryReturnType<T> = {
  data: T;
  isLoading: boolean;
  pageLinks?: string;
};

export function useSpansQuery<T = any[]>({
  eventView,
  initialData,
  limit,
  enabled,
  referrer = 'use-spans-query',
  cursor,
}: {
  cursor?: string;
  enabled?: boolean;
  eventView?: EventView;
  initialData?: any;
  limit?: number;
  referrer?: string;
}): UseSpansQueryReturnType<T> {
  const queryFunction = getQueryFunction({
    isTimeseriesQuery: (eventView?.yAxis?.length ?? 0) > 0,
  });
  if (eventView) {
    return queryFunction({eventView, initialData, limit, enabled, referrer, cursor});
  }
  throw new Error('eventView argument must be defined when Starfish useDiscover is true');
}

export function useWrappedDiscoverTimeseriesQuery({
  eventView,
  enabled,
  initialData,
  referrer,
  cursor,
}: {
  eventView: EventView;
  cursor?: string;
  enabled?: boolean;
  initialData?: any;
  referrer?: string;
}) {
  const location = useLocation();
  const organization = useOrganization();
  const {isLoading, data} = useGenericDiscoverQuery<
    {
      data: any[];
    },
    DiscoverQueryProps
  >({
    route: 'events-stats',
    eventView,
    location,
    orgSlug: organization.slug,
    getRequestPayload: () => ({
      ...eventView.getEventsAPIPayload(location),
      yAxis: eventView.yAxis,
      topEvents: eventView.topEvents,
      excludeOther: 0,
      partial: 1,
      orderby: eventView.sorts?.[0] ? encodeSort(eventView.sorts?.[0]) : undefined,
      interval: eventView.interval,
      cursor,
    }),
    options: {
      enabled,
      refetchOnWindowFocus: false,
    },
    referrer,
  });
  return {
    isLoading,
    data:
      isLoading && initialData
        ? initialData
        : processDiscoverTimeseriesResult(data, eventView),
  };
}

export function useWrappedDiscoverQuery({
  eventView,
  initialData,
  enabled,
  referrer,
  limit,
  cursor,
}: {
  eventView: EventView;
  cursor?: string;
  enabled?: boolean;
  initialData?: any;
  limit?: number;
  referrer?: string;
}) {
  const location = useLocation();
  const organization = useOrganization();
  const {isLoading, data, pageLinks} = useDiscoverQuery({
    eventView,
    orgSlug: organization.slug,
    location,
    referrer,
    cursor,
    limit,
    options: {
      enabled,
      refetchOnWindowFocus: false,
    },
  });
  return {
    isLoading,
    data: isLoading && initialData ? initialData : data?.data,
    pageLinks,
  };
}

function getQueryFunction({isTimeseriesQuery}: {isTimeseriesQuery?: boolean}) {
  if (isTimeseriesQuery) {
    return useWrappedDiscoverTimeseriesQuery;
  }

  return useWrappedDiscoverQuery;
}

type Interval = {[key: string]: any; interval: string; group?: string};

function processDiscoverTimeseriesResult(result, eventView: EventView) {
  if (!eventView.yAxis) {
    return [];
  }
  let intervals = [] as Interval[];
  const singleYAxis =
    eventView.yAxis &&
    (typeof eventView.yAxis === 'string' || eventView.yAxis.length === 1);
  const firstYAxis =
    typeof eventView.yAxis === 'string' ? eventView.yAxis : eventView.yAxis[0];
  if (result.data) {
    const timeSeriesResult: Interval[] = processSingleDiscoverTimeseriesResult(
      result,
      singleYAxis ? firstYAxis : 'count'
    ).map(data => ({
      interval: moment(parseInt(data.interval, 10) * 1000).format(DATE_FORMAT),
      [firstYAxis]: data[firstYAxis],
      group: data.group,
    }));
    return timeSeriesResult;
  }
  Object.keys(result).forEach(key => {
    if (result[key].data) {
      intervals = mergeIntervals(
        intervals,
        processSingleDiscoverTimeseriesResult(result[key], singleYAxis ? firstYAxis : key)
      );
    } else {
      Object.keys(result[key]).forEach(innerKey => {
        if (innerKey !== 'order') {
          intervals = mergeIntervals(
            intervals,
            processSingleDiscoverTimeseriesResult(result[key][innerKey], innerKey, key)
          );
        }
      });
    }
  });

  const processed = intervals.map(interval => ({
    ...interval,
    interval: moment(parseInt(interval.interval, 10) * 1000).format(DATE_FORMAT),
  }));
  return processed;
}

function processSingleDiscoverTimeseriesResult(result, key: string, group?: string) {
  const intervals = [] as Interval[];
  result.data.forEach(([timestamp, [{count: value}]]) => {
    const existingInterval = intervals.find(
      interval =>
        interval.interval === timestamp && (group ? interval.group === group : true)
    );
    if (existingInterval) {
      existingInterval[key] = value;
      return;
    }
    intervals.push({
      interval: timestamp,
      [key]: value,
      group,
    });
  });
  return intervals;
}

function mergeIntervals(first: Interval[], second: Interval[]) {
  const target: Interval[] = JSON.parse(JSON.stringify(first));
  second.forEach(({interval: timestamp, group, ...rest}) => {
    const existingInterval = target.find(
      interval =>
        interval.interval === timestamp && (group ? interval.group === group : true)
    );
    if (existingInterval) {
      Object.keys(rest).forEach(key => {
        existingInterval[key] = rest[key];
      });
      return;
    }
    target.push({interval: timestamp, group, ...rest});
  });
  return target;
}
