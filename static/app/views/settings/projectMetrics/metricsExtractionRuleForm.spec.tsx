import {initializeOrg} from 'sentry-test/initializeOrg';
import {render, screen, userEvent} from 'sentry-test/reactTestingLibrary';
import {textWithMarkupMatcher} from 'sentry-test/utils';

import {INITIAL_DATA} from 'sentry/views/settings/projectMetrics/metricsExtractionRuleCreateModal';
import {MetricsExtractionRuleForm} from 'sentry/views/settings/projectMetrics/metricsExtractionRuleForm';

function renderMockRequests({orgSlug, projectId}: {orgSlug: string; projectId: string}) {
  MockApiClient.addMockResponse({
    url: `/organizations/${orgSlug}/spans/fields/`,
    body: [],
  });
  MockApiClient.addMockResponse({
    url: `/projects/${orgSlug}/${projectId}/metrics/extraction-rules/`,
    method: 'GET',
    body: [
      {
        aggregates: ['count'],
        conditions: [{id: 102, value: '', mris: ['c:custom/span_attribute_102@none']}],
        createdById: 3142223,
        dateAdded: '2024-07-29T12:04:23.196785Z',
        dateUpdated: '2024-07-29T12:04:23.197008Z',
        projectId,
        spanAttribute: 'A',
        tags: ['release', 'environment'],
        unit: 'none',
      },
    ],
  });
}

describe('Metrics Extraction Rule Form', function () {
  it('by typing a new value in the "select attribute" field, the UI shall display a hint about custom attribute', async function () {
    const {project} = initializeOrg();

    renderMockRequests({orgSlug: project.organization.slug, projectId: project.id});

    render(
      <MetricsExtractionRuleForm initialData={INITIAL_DATA} projectId={project.id} />
    );

    await userEvent.type(screen.getByText('Select span attribute'), 'new-metric');

    expect(screen.getByText(/See how to instrument a custom attribute/)).toHaveAttribute(
      'href',
      'https://docs.sentry.io/product/explore/metrics/metrics-set-up/'
    );
  });

  it('by changing the form an info about ingest delay shall be displayed', async function () {
    const {project} = initializeOrg();

    renderMockRequests({orgSlug: project.organization.slug, projectId: project.id});

    render(
      <MetricsExtractionRuleForm initialData={INITIAL_DATA} projectId={project.id} />
    );

    await userEvent.type(screen.getByText('Select span attribute'), 'new-metric');

    await userEvent.click(screen.getByText(textWithMarkupMatcher('Create "new-metric"')));

    await userEvent.click(screen.getByText(/we’ll need a moment/));

    expect(
      screen.getByText(
        /collect data from spans sent after you created the metric and not before/
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/instrument your custom attribute/)).toHaveAttribute(
      'href',
      'https://docs.sentry.io/product/explore/metrics/metrics-set-up/'
    );
  });
});
