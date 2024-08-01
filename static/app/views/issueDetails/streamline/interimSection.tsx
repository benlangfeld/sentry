import {Fragment} from 'react';
import styled from '@emotion/styled';

import {
  EventDataSection,
  type EventDataSectionProps,
} from 'sentry/components/events/eventDataSection';
import {space} from 'sentry/styles/space';
import {
  FoldSection,
  type FoldSectionKey,
} from 'sentry/views/issueDetails/streamline/foldSection';
import {useHasStreamlinedUI} from 'sentry/views/issueDetails/utils';

/**
 * This section is meant to provide a shared component while the streamline UI
 * for issue details is being developed. Once GA'd, all occurances should be replaced
 * with just <FoldSection />
 */
export function InterimSection({
  children,
  title,
  type,
  actions = null,
  ...props
}: EventDataSectionProps) {
  const hasStreamlinedUI = useHasStreamlinedUI();

  return hasStreamlinedUI ? (
    <Fragment>
      <FoldSection sectionKey={type as FoldSectionKey} title={title} actions={actions}>
        {children}
      </FoldSection>
      <Divider />
    </Fragment>
  ) : (
    <EventDataSection title={title} actions={actions} type={type} {...props}>
      {children}
    </EventDataSection>
  );
}

const Divider = styled('hr')`
  border-color: ${p => p.theme.border};
  margin: ${space(1)} 0;
  &:last-child {
    display: none;
  }
`;
