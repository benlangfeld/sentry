import {Fragment, useContext, useState} from 'react';

import AnalyticsProvider, {
  AnalyticsContext,
} from 'sentry/components/devtoolbar/components/analyticsProvider';
import ExternalLink from 'sentry/components/links/externalLink';
import {Cell} from 'sentry/components/replays/virtualizedGrid/bodyCell';
import Switch from 'sentry/components/switchButton';

import useConfiguration from '../../hooks/useConfiguration';
import {inlineLinkCss} from '../../styles/link';
import {panelInsetContentCss} from '../../styles/panel';
import {smallCss} from '../../styles/typography';
import type {FlagValue} from '../../types';

import {useFeatureFlagsContext} from './featureFlagsContext';

type FeatureFlag = {name: string; override: FlagValue; value: FlagValue};

export default function FeatureFlagItem({flag}: {flag: FeatureFlag}) {
  const {featureFlags} = useConfiguration();

  return (
    <Fragment>
      <Cell css={[panelInsetContentCss, {alignItems: 'flex-start'}]}>
        {featureFlags?.urlTemplate?.(flag.name) ? (
          <ExternalLink
            css={[smallCss, inlineLinkCss]}
            href={featureFlags.urlTemplate(flag.name)}
          >
            {flag.name}
          </ExternalLink>
        ) : (
          <span>{flag.name}</span>
        )}
      </Cell>
      <Cell>
        <FlagValueInput flag={flag} />
      </Cell>
    </Fragment>
  );
}

function FlagValueInput({flag}: {flag: FeatureFlag}) {
  if (
    typeof flag.value === 'boolean' ||
    flag.override === true ||
    flag.override === false
  ) {
    return (
      <AnalyticsProvider keyVal="bool-override" nameVal="Boolean Override">
        <FlagValueBooleanInput flag={flag} />
      </AnalyticsProvider>
    );
  }

  return (
    <code>
      {flag.override !== undefined ? String(flag.override) : String(flag.value)}
    </code>
  );
}

function FlagValueBooleanInput({flag}: {flag: FeatureFlag}) {
  const {eventName, eventKey} = useContext(AnalyticsContext);
  const {trackAnalytics} = useConfiguration();
  const {setOverride} = useFeatureFlagsContext();

  const [isActive, setIsActive] = useState(
    flag.override !== undefined ? Boolean(flag.override) : Boolean(flag.value)
  );

  return (
    <label
      htmlFor={`toggle-${flag.name}`}
      css={{
        display: 'flex',
        alignItems: 'flex-end',
        alignSelf: 'flex-end',
        gap: 'var(--space100)',
      }}
    >
      <code>{String(isActive)}</code>
      <Switch
        id={`toggle-${flag.name}`}
        isActive={isActive}
        toggle={() => {
          setOverride(flag.name, !isActive);
          setIsActive(!isActive);
          trackAnalytics?.({
            eventKey: eventKey + '.toggled',
            eventName: eventName + ' toggled',
          });
        }}
      />
    </label>
  );
}
