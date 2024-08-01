import {useCallback} from 'react';
import styled from '@emotion/styled';
import omit from 'lodash/omit';

import {Breadcrumbs} from 'sentry/components/breadcrumbs';
import ButtonBar from 'sentry/components/buttonBar';
import Duration from 'sentry/components/duration';
import ErrorBoundary from 'sentry/components/errorBoundary';
import FeedbackWidgetButton from 'sentry/components/feedback/widget/feedbackWidgetButton';
import * as Layout from 'sentry/components/layouts/thirds';
import {DatePageFilter} from 'sentry/components/organizations/datePageFilter';
import {EnvironmentPageFilter} from 'sentry/components/organizations/environmentPageFilter';
import PageFilterBar from 'sentry/components/organizations/pageFilterBar';
import {ProjectPageFilter} from 'sentry/components/organizations/projectPageFilter';
import {PageHeadingQuestionTooltip} from 'sentry/components/pageHeadingQuestionTooltip';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {NewQuery} from 'sentry/types';
import {browserHistory} from 'sentry/utils/browserHistory';
import {useDiscoverQuery} from 'sentry/utils/discover/discoverQuery';
import EventView from 'sentry/utils/discover/eventView';
import {DURATION_UNITS} from 'sentry/utils/discover/fieldRenderers';
import {DiscoverDatasets} from 'sentry/utils/discover/types';
import {formatFloat} from 'sentry/utils/number/formatFloat';
import {PageAlert, PageAlertProvider} from 'sentry/utils/performance/contexts/pageAlert';
import {MutableSearch} from 'sentry/utils/tokenizeSearch';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import usePageFilters from 'sentry/utils/usePageFilters';
import {ModulePageProviders} from 'sentry/views/insights/common/components/modulePageProviders';
import {useModuleBreadcrumbs} from 'sentry/views/insights/common/utils/useModuleBreadcrumbs';
import useCrossPlatformProject from 'sentry/views/insights/mobile/common/queries/useCrossPlatformProject';
import {PlatformSelector} from 'sentry/views/insights/mobile/screenload/components/platformSelector';
import VitalCard from 'sentry/views/insights/mobile/vitals/components/vitalCard';
import {VitalScreens} from 'sentry/views/insights/mobile/vitals/components/vitalScreens';
import {
  MODULE_DESCRIPTION,
  MODULE_DOC_LINK,
  MODULE_TITLE,
} from 'sentry/views/insights/mobile/vitals/settings';
import {ModuleName} from 'sentry/views/insights/types';
import {VitalState} from 'sentry/views/performance/vitalDetail/utils';

export function VitalsLandingPage() {
  const moduleName = ModuleName.MOBILE_VITALS;
  const crumbs = useModuleBreadcrumbs(moduleName);
  const location = useLocation();
  const organization = useOrganization();
  const {isProjectCrossPlatform, selectedPlatform} = useCrossPlatformProject();
  // const {primaryRelease, secondaryRelease} = useReleaseSelection();

  const handleProjectChange = useCallback(() => {
    browserHistory.replace({
      ...location,
      query: {
        ...omit(location.query, ['primaryRelease', 'secondaryRelease']),
      },
    });
  }, [location]);
  const {selection} = usePageFilters();

  const vitalItems: VitalItem[] = [
    {
      title: t('Cold App Start'),
      description: t('Average Cold App Start duration'),
      field: 'avg(measurements.app_start_cold)',
      dataset: DiscoverDatasets.METRICS,
      getStatus: (metric: MetricValue) => {
        let description = '';
        let status = PerformanceScore.NONE;

        if (typeof metric.value === 'number' && metric.unit) {
          const durationMs = metric.value * DURATION_UNITS[metric.unit];

          // TODO should be platform dependant
          if (durationMs > 5000) {
            status = PerformanceScore.BAD;
            description = VitalState.POOR;
          } else if (durationMs > 3000) {
            status = PerformanceScore.NEEDS_IMPROVEMENT;
            description = VitalState.MEH;
          } else if (durationMs > 0) {
            status = PerformanceScore.GOOD;
            description = VitalState.GOOD;
          }
        }
        return {
          score: status,
          description: description,
        };
      },
    },
    {
      title: t('Warm App Start'),
      description: t('Average Warm App Start duration'),
      field: 'avg(measurements.app_start_warm)',
      dataset: DiscoverDatasets.METRICS,
      getStatus: (metric: MetricValue) => {
        let description = '';
        let status = PerformanceScore.NONE;

        if (typeof metric.value === 'number' && metric.unit) {
          const durationMs = metric.value * DURATION_UNITS[metric.unit];

          // TODO should be platform dependant
          if (durationMs > 2000) {
            status = PerformanceScore.BAD;
            description = VitalState.POOR;
          } else if (durationMs > 1000) {
            status = PerformanceScore.NEEDS_IMPROVEMENT;
            description = VitalState.MEH;
          } else if (durationMs > 0) {
            status = PerformanceScore.GOOD;
            description = VitalState.GOOD;
          }
        }
        return {
          score: status,
          description: description,
        };
      },
    },
    {
      title: t('Slow Frames'),
      description: t('Average number of slow frames'),
      field: `avg(mobile.slow_frames)`,
      dataset: DiscoverDatasets.SPANS_METRICS,
      getStatus: (_: MetricValue) => {
        // TODO define thresholds
        return {
          score: PerformanceScore.NONE,
          description: '',
        };
      },
    },
    {
      title: t('Frozen Frames'),
      description: t('Average number of frozen frames'),
      field: `avg(mobile.frozen_frames)`,
      dataset: DiscoverDatasets.SPANS_METRICS,
      getStatus: (_: MetricValue) => {
        // TODO define thresholds
        return {
          score: PerformanceScore.NONE,
          description: '',
        };
      },
    },
    {
      title: t('Frame Delay'),
      description: t('Average frame delay'),
      field: `avg(mobile.frames_delay)`,
      dataset: DiscoverDatasets.SPANS_METRICS,
      getStatus: (_: MetricValue) => {
        // TODO define thresholds
        return {
          score: PerformanceScore.NONE,
          description: '',
        };
      },
    },
    {
      title: t('TTID'),
      description: t('Average time to intial display.'),
      field: `avg(measurements.time_to_initial_display)`,
      dataset: DiscoverDatasets.METRICS,
      getStatus: (_: MetricValue) => {
        // TODO define thresholds
        return {
          score: PerformanceScore.NONE,
          description: '',
        };
      },
    },
    {
      title: t('TTFD'),
      description: t('Average time to full display.'),
      field: `avg(measurements.time_to_full_display)`,
      dataset: DiscoverDatasets.METRICS,
      getStatus: (_: MetricValue) => {
        // TODO define thresholds
        return {
          score: PerformanceScore.NONE,
          description: '',
        };
      },
    },
  ];

  const metricsFields: string[] = new Array();
  const spanMetricsFields: string[] = new Array();

  vitalItems.forEach(element => {
    if (element.dataset === DiscoverDatasets.METRICS) {
      metricsFields.push(element.field);
    } else if (element.dataset === DiscoverDatasets.SPANS_METRICS) {
      spanMetricsFields.push(element.field);
    }
  });

  const query = new MutableSearch(['transaction.op:ui.load']);
  if (isProjectCrossPlatform) {
    query.addFilterValue('os.name', selectedPlatform);
  }
  const metricsQuery: NewQuery = {
    name: '',
    fields: metricsFields,
    query: query.formatString(),
    dataset: DiscoverDatasets.METRICS,
    version: 2,
    projects: selection.projects,
  };
  const metricsQueryView: EventView = EventView.fromNewQueryWithLocation(
    metricsQuery,
    location
  );

  const metricsResult = useDiscoverQuery({
    eventView: metricsQueryView,
    location,
    orgSlug: organization.slug,
    limit: 25,
    referrer: 'api.starfish.mobile-vitals-table',
  });

  const spanMetricsQuery: NewQuery = {
    name: '',
    fields: spanMetricsFields,
    query: query.formatString(),
    dataset: DiscoverDatasets.SPANS_METRICS,
    version: 2,
    projects: selection.projects,
  };

  const spanMetricsQueryView = EventView.fromNewQueryWithLocation(
    spanMetricsQuery,
    location
  );

  const spanMetricsResult = useDiscoverQuery({
    eventView: spanMetricsQueryView,
    location,
    orgSlug: organization.slug,
    limit: 25,
    referrer: 'api.starfish.mobile-vitals-table',
  });

  const metricValueFor = (item: VitalItem): MetricValue | undefined => {
    const dataset =
      item.dataset === DiscoverDatasets.METRICS ? metricsResult : spanMetricsResult;

    if (dataset.data) {
      const row = dataset.data.data[0];
      const units = dataset.data.meta?.units;
      const fieldTypes = dataset.data.meta?.fields;

      const value = row[item.field];
      const unit = units?.[item.field];
      const fieldType = fieldTypes?.[item.field];

      return {
        type: fieldType,
        unit: unit,
        value: value,
      };
    }

    return undefined;
  };

  const formattedMetricValueFor = (metric: MetricValue): React.ReactNode => {
    if (typeof metric.value === 'number' && metric.type === 'duration' && metric.unit) {
      return (
        <Duration
          seconds={
            (metric.value * ((metric.unit && DURATION_UNITS[metric.unit]) ?? 1)) / 1000
          }
          fixedDigits={2}
          abbreviation
        />
      );
    }

    if (typeof metric.value === 'number' && metric.type === 'number') {
      return <span>{formatFloat(metric.value, 2)}</span>;
    }

    return <span>{metric.value}</span>;
  };

  return (
    <ModulePageProviders moduleName="mobile-vitals" features={['insights-addon-modules']}>
      <Layout.Page>
        <PageAlertProvider>
          <Layout.Header>
            <Layout.HeaderContent>
              <Breadcrumbs crumbs={crumbs} />
              <Layout.Title>
                {MODULE_TITLE}
                <PageHeadingQuestionTooltip
                  docsUrl={MODULE_DOC_LINK}
                  title={MODULE_DESCRIPTION}
                />
              </Layout.Title>
            </Layout.HeaderContent>
            <Layout.HeaderActions>
              <ButtonBar gap={1}>
                {isProjectCrossPlatform && <PlatformSelector />}
                <FeedbackWidgetButton />
              </ButtonBar>
            </Layout.HeaderActions>
          </Layout.Header>

          <Layout.Body>
            <Layout.Main fullWidth>
              <Container>
                <PageFilterBar condensed>
                  <ProjectPageFilter onChange={handleProjectChange} />
                  <EnvironmentPageFilter />
                  <DatePageFilter />
                </PageFilterBar>
              </Container>
              <PageAlert />
              <ErrorBoundary mini>
                <Container>
                  <Flex>
                    {vitalItems.map(item => {
                      const metricValue = metricValueFor(item);
                      const status =
                        (metricValue && item.getStatus(metricValue)) ?? STATUS_UNKNOWN;
                      const formattedValue: React.ReactNode =
                        metricValue && formattedMetricValueFor(metricValue);

                      return (
                        <VitalCard
                          key={item.field}
                          title={item.title}
                          description={item.description}
                          statusLabel={status.description}
                          status={status.score}
                          formattedValue={formattedValue}
                        />
                      );
                    })}
                  </Flex>
                  <VitalScreens />
                </Container>
              </ErrorBoundary>
            </Layout.Main>
          </Layout.Body>
        </PageAlertProvider>
      </Layout.Page>
    </ModulePageProviders>
  );
}

type MetricValue = {
  // the field type if defined, e.g. duration
  type: string | undefined;

  // the unit of the value, e.g. milliseconds
  unit: string | undefined;

  // the actual value
  value: string | number | undefined;
};

// maps to PERFORMANCE_SCORE_COLORS keys
enum PerformanceScore {
  GOOD = 'good',
  NEEDS_IMPROVEMENT = 'needsImprovement',
  BAD = 'bad',
  NONE = 'none',
}

type VitalStatus = {
  description: string | undefined;
  score: PerformanceScore;
};

const STATUS_UNKNOWN: VitalStatus = {
  description: undefined,
  score: PerformanceScore.NONE,
};

type VitalItem = {
  dataset: DiscoverDatasets;
  description: string;
  field: string;
  getStatus: (value: MetricValue) => VitalStatus;
  title: string;
};

const Container = styled('div')`
  margin-bottom: ${space(1)};
`;

const Flex = styled('div')<{gap?: number}>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
  gap: ${p => (p.gap ? `${p.gap}px` : space(1))};
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: ${space(1)};
`;

export default VitalsLandingPage;
