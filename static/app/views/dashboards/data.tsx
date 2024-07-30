import {t} from 'sentry/locale';
import type {Organization} from 'sentry/types/organization';
import {uniqueId} from 'sentry/utils/guid';

import type {DashboardDetails} from './types';
import {DisplayType, WidgetType} from './types';

type DashboardTemplate = DashboardDetails & {
  description: string;
};

export const EMPTY_DASHBOARD: DashboardDetails = {
  id: '',
  dateCreated: '',
  createdBy: undefined,
  title: t('Untitled dashboard'),
  widgets: [],
  projects: [],
  filters: {},
};

export const getDashboardTemplates = (organization: Organization) => {
  return [
    {
      id: 'default-template',
      dateCreated: '',
      createdBy: undefined,
      title: t('General Template'),
      description: t('Various Frontend and Backend Widgets'),
      projects: [],
      filters: {},
      widgets: [
        {
          title: t('Number of Errors'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['count()'],
              aggregates: ['count()'],
              columns: [],
              conditions: '!event.type:transaction',
              orderby: 'count()',
            },
          ],
        },
        {
          title: t('Number of Issues'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['count_unique(issue)'],
              aggregates: ['count_unique(issue)'],
              columns: [],
              conditions: '!event.type:transaction',
              orderby: 'count_unique(issue)',
            },
          ],
        },
        {
          title: t('Events'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 4,
            x: 2,
            y: 0,
          },
          queries: [
            {
              name: t('Events'),
              fields: ['count()'],
              aggregates: ['count()'],
              columns: [],
              conditions: '!event.type:transaction',
              orderby: 'count()',
            },
          ],
        },
        {
          title: t('Affected Users'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 1,
            x: 1,
            y: 2,
          },
          queries: [
            {
              name: t('Known Users'),
              fields: ['count_unique(user)'],
              aggregates: ['count_unique(user)'],
              columns: [],
              conditions: 'has:user.email !event.type:transaction',
              orderby: 'count_unique(user)',
            },
            {
              name: t('Anonymous Users'),
              fields: ['count_unique(user)'],
              aggregates: ['count_unique(user)'],
              columns: [],
              conditions: '!has:user.email !event.type:transaction',
              orderby: 'count_unique(user)',
            },
          ],
        },
        {
          title: t('Handled vs. Unhandled'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 1,
            x: 0,
            y: 2,
          },
          queries: [
            {
              name: t('Handled'),
              fields: ['count()'],
              aggregates: ['count()'],
              columns: [],
              conditions: 'error.handled:true',
              orderby: 'count()',
            },
            {
              name: t('Unhandled'),
              fields: ['count()'],
              aggregates: ['count()'],
              columns: [],
              conditions: 'error.handled:false',
              orderby: 'count()',
            },
          ],
        },
        {
          title: t('Errors by Country'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 4,
            y: 6,
          },
          queries: [
            {
              name: '',
              fields: ['geo.country_code', 'geo.region', 'count()'],
              aggregates: ['count()'],
              columns: ['geo.country_code', 'geo.region'],
              conditions: '!event.type:transaction has:geo.country_code',
              orderby: 'count()',
            },
          ],
        },
        {
          title: t('High Throughput Transactions'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 0,
            y: 6,
          },
          queries: [
            {
              name: '',
              fields: ['count()', 'transaction'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'event.type:transaction',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Errors by Browser'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 1,
            x: 5,
            y: 2,
          },
          queries: [
            {
              name: '',
              fields: ['browser.name', 'count()'],
              aggregates: ['count()'],
              columns: ['browser.name'],
              conditions: '!event.type:transaction has:browser.name',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Overall User Misery'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['user_misery(300)'],
              aggregates: ['user_misery(300)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall Apdex'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['apdex(300)'],
              aggregates: ['apdex(300)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('High Throughput Transactions'),
          displayType: DisplayType.TOP_N,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 2,
            x: 0,
            y: 4,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'count()'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'event.type:transaction',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Issues Assigned to Me or My Teams'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: WidgetType.ISSUE,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 2,
            y: 2,
          },
          queries: [
            {
              name: '',
              fields: ['assignee', 'issue', 'title'],
              aggregates: [],
              columns: ['assignee', 'issue', 'title'],
              conditions: 'assigned_or_suggested:me is:unresolved',
              orderby: 'trends',
            },
          ],
        },
        {
          title: t('Transactions Ordered by Misery'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            y: 6,
            x: 2,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'user_misery(300)'],
              aggregates: ['user_misery(300)'],
              columns: ['transaction'],
              conditions: '',
              orderby: '-user_misery(300)',
            },
          ],
        },
        {
          title: t('Errors by Browser Over Time'),
          displayType: DisplayType.TOP_N,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 1,
            x: 4,
            y: 2,
          },
          queries: [
            {
              name: '',
              fields: ['browser.name', 'count()'],
              aggregates: ['count()'],
              columns: ['browser.name'],
              conditions: 'event.type:error has:browser.name',
              orderby: '-count()',
            },
          ],
        },
      ],
    },
    {
      id: 'frontend-template',
      title: t('Frontend Template'),
      dateCreated: '',
      createdBy: undefined,
      description: t('Erroring URLs and Web Vitals'),
      projects: [],
      filters: {},
      widgets: [
        {
          title: t('Top 5 Issues by Unique Users Over Time'),
          displayType: DisplayType.TOP_N,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 4,
            x: 0,
            y: 4,
          },
          queries: [
            {
              name: '',
              fields: ['issue', 'count_unique(user)'],
              aggregates: ['count_unique(user)'],
              columns: ['issue'],
              conditions: '',
              orderby: '-count_unique(user)',
            },
          ],
        },
        {
          title: t('Errors by Browser as Percentage'),
          displayType: DisplayType.AREA,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 0,
            y: 9,
          },
          queries: [
            {
              name: '',
              fields: [
                'equation|count_if(browser.name,equals,Chrome)/count() * 100',
                'equation|count_if(browser.name,equals,Firefox)/count() * 100',
                'equation|count_if(browser.name,equals,Safari)/count() * 100',
              ],
              aggregates: [
                'equation|count_if(browser.name,equals,Chrome)/count() * 100',
                'equation|count_if(browser.name,equals,Firefox)/count() * 100',
                'equation|count_if(browser.name,equals,Safari)/count() * 100',
              ],
              columns: [],
              conditions: 'has:browser.name',
              orderby: '',
            },
          ],
        },
        {
          title: t('Issues Assigned to Me or My Teams'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: WidgetType.ISSUE,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 4,
            y: 4,
          },
          queries: [
            {
              name: '',
              fields: ['assignee', 'issue', 'title'],
              aggregates: [],
              columns: ['assignee', 'issue', 'title'],
              conditions: 'assigned_or_suggested:me is:unresolved',
              orderby: 'date',
            },
          ],
        },
        {
          title: t('Top 5 Issues by Unique Users'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 3,
            minH: 2,
            w: 4,
            x: 0,
            y: 6,
          },
          queries: [
            {
              name: '',
              fields: ['issue', 'count_unique(user)', 'title'],
              aggregates: ['count_unique(user)'],
              columns: ['issue', 'title'],
              conditions: '',
              orderby: '-count_unique(user)',
            },
          ],
        },
        {
          title: t('URLs grouped by Issue'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 5,
            minH: 2,
            w: 2,
            x: 4,
            y: 8,
          },
          queries: [
            {
              name: '',
              fields: ['http.url', 'issue', 'count_unique(user)'],
              aggregates: ['count_unique(user)'],
              columns: ['http.url', 'issue'],
              conditions: 'event.type:error',
              orderby: '-count_unique(user)',
            },
          ],
        },
        {
          title: t('Transactions 404ing'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 2,
            y: 9,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'count()'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'transaction.status:not_found',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Layout Shift Over Time'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 1,
            x: 2,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.cls)'],
              aggregates: ['p75(measurements.cls)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('LCP by Country'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 2,
            x: 2,
            y: 2,
          },
          queries: [
            {
              name: '',
              fields: ['geo.country_code', 'geo.region', 'p75(measurements.lcp)'],
              aggregates: ['p75(measurements.lcp)'],
              columns: ['geo.country_code', 'geo.region'],
              conditions: 'has:geo.country_code',
              orderby: '-p75(measurements.lcp)',
            },
          ],
        },
        {
          title: t('Page Load Over Time'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 1,
            x: 3,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.lcp)', 'p75(measurements.fcp)'],
              aggregates: ['p75(measurements.lcp)', 'p75(measurements.fcp)'],
              columns: [],
              conditions: 'transaction.op:pageload',
              orderby: '',
            },
          ],
        },
        {
          title: t('Slowest Pageloads'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          layout: {
            h: 2,
            minH: 2,
            w: 2,
            x: 0,
            y: 2,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'count()'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'transaction.op:pageload p75(measurements.lcp):>4s',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Overall LCP'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.lcp)'],
              aggregates: ['p75(measurements.lcp)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Slow Page Navigations'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 4,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'count()'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'transaction.duration:>2s',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Overall FCP'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.fcp)'],
              aggregates: ['p75(measurements.fcp)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall CLS'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.cls)'],
              aggregates: ['p75(measurements.cls)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall FID'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.fid)'],
              aggregates: ['p75(measurements.fid)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
      ],
    },
    {
      id: 'backend-template',
      title: t('Backend Template'),
      dateCreated: '',
      createdBy: undefined,
      description: t('Issues and Performance'),
      projects: [],
      filters: {},
      widgets: [
        {
          title: t('Top 5 Issues by Unique Users Over Time'),
          displayType: DisplayType.TOP_N,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 0,
            y: 6,
          },
          queries: [
            {
              name: '',
              fields: ['issue', 'count_unique(user)'],
              aggregates: ['count_unique(user)'],
              columns: ['issue'],
              conditions: '',
              orderby: '-count_unique(user)',
            },
          ],
        },
        {
          title: t('Transactions Erroring Over Time'),
          displayType: DisplayType.TOP_N,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 4,
            x: 2,
            y: 8,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'count()'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'transaction.status:internal_error',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Erroring Transactions by Percentage'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 5,
            minH: 2,
            w: 2,
            x: 4,
            y: 10,
          },
          queries: [
            {
              name: '',
              fields: [
                'equation|count_if(transaction.status,equals,internal_error) / count() * 100',
                'transaction',
                'count_if(transaction.status,equals,internal_error)',
                'count()',
              ],
              aggregates: [
                'equation|count_if(transaction.status,equals,internal_error) / count() * 100',
                'count_if(transaction.status,equals,internal_error)',
                'count()',
              ],
              columns: ['transaction'],
              conditions: 'count():>100',
              orderby: '-equation[0]',
            },
          ],
        },
        {
          title: t('Top 5 Issues by Unique Users'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 5,
            minH: 2,
            w: 2,
            x: 0,
            y: 10,
          },
          queries: [
            {
              name: '',
              fields: ['issue', 'count_unique(user)', 'title'],
              aggregates: ['count_unique(user)'],
              columns: ['issue', 'title'],
              conditions: '',
              orderby: '-count_unique(user)',
            },
          ],
        },
        {
          title: t('Transactions Erroring'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 5,
            minH: 2,
            w: 2,
            x: 2,
            y: 10,
          },
          queries: [
            {
              name: '',
              fields: ['count()', 'transaction'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'transaction.status:internal_error',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Issues Assigned to Me or My Teams'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: WidgetType.ISSUE,
          tempId: uniqueId(),
          layout: {
            h: 7,
            minH: 2,
            w: 6,
            x: 0,
            y: 15,
          },
          queries: [
            {
              name: '',
              fields: ['assignee', 'issue', 'title'],
              aggregates: [],
              columns: ['assignee', 'issue', 'title'],
              conditions: 'assigned_or_suggested:me is:unresolved',
              orderby: 'date',
            },
          ],
        },
        {
          title: t('p75 Over Time'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 4,
            x: 2,
            y: 2,
          },
          queries: [
            {
              name: '',
              fields: ['p75(transaction.duration)'],
              aggregates: ['p75(transaction.duration)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Throughput (Errors Per Minute)'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 4,
            x: 2,
            y: 0,
          },
          queries: [
            {
              name: 'Errors',
              fields: ['epm()'],
              aggregates: ['epm()'],
              columns: [],
              conditions: 'event.type:error',
              orderby: '',
            },
          ],
        },
        {
          title: t('Tasks Transactions with Poor Apdex'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 0,
            y: 2,
          },
          queries: [
            {
              name: '',
              fields: ['count()', 'transaction'],
              aggregates: ['count()'],
              columns: ['transaction'],
              conditions: 'apdex():<0.5 transaction.op:*task*',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('HTTP Transactions with Poor Apdex'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 4,
            x: 2,
            y: 4,
          },
          queries: [
            {
              name: '',
              fields: ['epm()', 'http.method', 'http.status_code', 'transaction'],
              aggregates: ['epm()'],
              columns: ['http.method', 'http.status_code', 'transaction'],
              conditions:
                'apdex():<0.5 transaction.op:*http* has:http.method has:http.status_code',
              orderby: '-epm()',
            },
          ],
        },
        {
          title: t('Overall Apdex'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['apdex(300)'],
              aggregates: ['apdex(300)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall Duration'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['p75(transaction.duration)'],
              aggregates: ['p75(transaction.duration)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall HTTP Spans'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['p75(spans.http)'],
              aggregates: ['p75(spans.http)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall DB Spans'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['p75(spans.db)'],
              aggregates: ['p75(spans.db)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
      ],
    },
    {
      id: 'mobile-template',
      title: t('Mobile Template'),
      dateCreated: '',
      createdBy: undefined,
      description: t('Crash Details and Performance Vitals'),
      projects: [],
      filters: {},
      widgets: [
        {
          title: t('Total Crashes'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['count()'],
              aggregates: ['count()'],
              columns: [],
              conditions: 'error.handled:false event.type:error',
              orderby: '',
            },
          ],
        },
        {
          title: t('Unique Users Who Crashed'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['count_unique(user)'],
              aggregates: ['count_unique(user)'],
              columns: [],
              conditions: 'error.handled:false event.type:error',
              orderby: '',
            },
          ],
        },
        {
          title: t('Unique Issues Causing Crashes'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 2,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['count_unique(issue)'],
              aggregates: ['count_unique(issue)'],
              columns: [],
              conditions: 'error.handled:false event.type:error',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall Number of Errors'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 3,
            y: 0,
          },
          queries: [
            {
              name: '',
              fields: ['count()'],
              aggregates: ['count()'],
              columns: [],
              conditions: 'event.type:error',
              orderby: '',
            },
          ],
        },
        {
          title: t('Issues Causing Crashes'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 3,
            x: 0,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['issue', 'count()', 'count_unique(user)'],
              aggregates: ['count()', 'count_unique(user)'],
              columns: ['issue'],
              conditions: 'error.handled:false',
              orderby: '-count_unique(user)',
            },
          ],
        },
        {
          title: t('Crashes Over Time'),
          displayType: DisplayType.LINE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 3,
            minH: 2,
            w: 2,
            x: 4,
            y: 0,
          },
          queries: [
            {
              name: t('Crashes'),
              fields: ['count()', 'count_unique(user)'],
              aggregates: ['count()', 'count_unique(user)'],
              columns: [],
              conditions: 'error.handled:false',
              orderby: '',
            },
          ],
        },
        {
          title: t('Crashes by OS'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.ERRORS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 2,
            minH: 2,
            w: 1,
            x: 3,
            y: 1,
          },
          queries: [
            {
              name: '',
              fields: ['os', 'count()'],
              aggregates: ['count()'],
              columns: ['os'],
              conditions: 'has:os error.handled:false',
              orderby: '-count()',
            },
          ],
        },
        {
          title: t('Overall Warm Startup Time'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 0,
            y: 3,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.app_start_warm)'],
              aggregates: ['p75(measurements.app_start_warm)'],
              columns: [],
              conditions: 'has:measurements.app_start_warm',
              orderby: '',
            },
          ],
        },
        {
          title: t('Overall Cold Startup Time'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 2,
            y: 3,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.app_start_cold)'],
              aggregates: ['p75(measurements.app_start_cold)'],
              columns: [],
              conditions: 'has:measurements.app_start_cold',
              orderby: '',
            },
          ],
        },
        {
          title: t('Warm Startup Times'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 0,
            y: 4,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'p75(measurements.app_start_warm)'],
              aggregates: ['p75(measurements.app_start_warm)'],
              columns: ['transaction'],
              conditions: 'has:measurements.app_start_warm',
              orderby: '-p75(measurements.app_start_warm)',
            },
          ],
        },
        {
          title: t('Cold Startup Times'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 2,
            y: 4,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'p75(measurements.app_start_cold)'],
              aggregates: ['p75(measurements.app_start_cold)'],
              columns: ['transaction'],
              conditions: 'has:measurements.app_start_cold',
              orderby: '-p75(measurements.app_start_cold)',
            },
          ],
        },
        {
          title: t('Overall Frozen Frames'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 4,
            y: 3,
          },
          queries: [
            {
              name: '',
              fields: ['p75(measurements.frames_frozen_rate)'],
              aggregates: ['p75(measurements.frames_frozen_rate)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Max Warm Startup Time'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 1,
            y: 3,
          },
          queries: [
            {
              name: '',
              fields: ['max(measurements.app_start_warm)'],
              aggregates: ['max(measurements.app_start_warm)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Max Cold Startup Time'),
          displayType: DisplayType.BIG_NUMBER,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 1,
            minH: 1,
            w: 1,
            x: 3,
            y: 3,
          },
          queries: [
            {
              name: '',
              fields: ['max(measurements.app_start_cold)'],
              aggregates: ['max(measurements.app_start_cold)'],
              columns: [],
              conditions: '',
              orderby: '',
            },
          ],
        },
        {
          title: t('Frozen Frames Rate'),
          displayType: DisplayType.TABLE,
          interval: '5m',
          widgetType: organization.features.includes(
            'performance-discover-dataset-selector'
          )
            ? WidgetType.TRANSACTIONS
            : WidgetType.DISCOVER,
          tempId: uniqueId(),
          layout: {
            h: 4,
            minH: 2,
            w: 2,
            x: 4,
            y: 4,
          },
          queries: [
            {
              name: '',
              fields: ['transaction', 'p75(measurements.frames_frozen_rate)'],
              aggregates: ['p75(measurements.frames_frozen_rate)'],
              columns: ['transaction'],
              conditions: 'has:measurements.frames_frozen_rate',
              orderby: '-p75(measurements.frames_frozen_rate)',
            },
          ],
        },
      ],
    },
  ] as DashboardTemplate[];
};

export const DISPLAY_TYPE_CHOICES = [
  {label: t('Area Chart'), value: 'area'},
  {label: t('Bar Chart'), value: 'bar'},
  {label: t('Line Chart'), value: 'line'},
  {label: t('Table'), value: 'table'},
  {label: t('Big Number'), value: 'big_number'},
  {label: t('Top 5 Events'), value: 'top_n'},
];

export const INTERVAL_CHOICES = [
  {label: t('1 Minute'), value: '1m'},
  {label: t('5 Minutes'), value: '5m'},
  {label: t('15 Minutes'), value: '15m'},
  {label: t('30 Minutes'), value: '30m'},
  {label: t('1 Hour'), value: '1h'},
  {label: t('1 Day'), value: '1d'},
];

export const DEFAULT_STATS_PERIOD = '24h';
