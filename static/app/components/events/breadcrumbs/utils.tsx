import type * as Timeline from 'sentry/components/timeline';
import {
  IconFire,
  IconFix,
  IconInfo,
  IconLocation,
  IconMobile,
  IconRefresh,
  IconSort,
  IconSpan,
  IconStack,
  IconTerminal,
  IconUser,
  IconWarning,
} from 'sentry/icons';
import {t} from 'sentry/locale';
import {BreadcrumbType, type RawCrumb} from 'sentry/types/breadcrumbs';
import {toTitleCase} from 'sentry/utils/string/toTitleCase';

export const BREADCRUMB_TIMESTAMP_PLACEHOLDER = '--';
const BREADCRUMB_TITLE_PLACEHOLDER = t('Generic');

export function getBreadcrumbTitle(category: RawCrumb['category']) {
  switch (category) {
    case 'http':
      return t('HTTP');
    case 'httplib':
      return t('httplib');
    case 'ui.click':
      return t('UI Click');
    case 'ui.input':
      return t('UI Input');
    case null:
    case undefined:
      return BREADCRUMB_TITLE_PLACEHOLDER;
    default:
      const titleCategory = category.split('.').join(' ');
      return toTitleCase(titleCategory);
  }
}

export function getBreadcrumbColorConfig(type?: BreadcrumbType): Timeline.ColorConfig {
  switch (type) {
    case BreadcrumbType.ERROR:
      return {primary: 'red400', secondary: 'red200'};
    case BreadcrumbType.WARNING:
      return {primary: 'yellow400', secondary: 'yellow200'};
    case BreadcrumbType.NAVIGATION:
    case BreadcrumbType.HTTP:
      return {primary: 'green400', secondary: 'green200'};
    case BreadcrumbType.INFO:
    case BreadcrumbType.QUERY:
      return {primary: 'blue400', secondary: 'blue200'};
    case BreadcrumbType.USER:
    case BreadcrumbType.UI:
    case BreadcrumbType.DEBUG:
      return {primary: 'purple400', secondary: 'purple200'};
    case BreadcrumbType.SYSTEM:
    case BreadcrumbType.SESSION:
    case BreadcrumbType.TRANSACTION:
      return {primary: 'pink400', secondary: 'pink200'};
    default:
      return {primary: 'gray300', secondary: 'gray200'};
  }
}

export function getBreadcrumbIcon(type?: BreadcrumbType): React.ReactNode {
  switch (type) {
    case BreadcrumbType.USER:
    case BreadcrumbType.UI:
      return <IconUser size="xs" />;
    case BreadcrumbType.NAVIGATION:
      return <IconLocation size="xs" />;
    case BreadcrumbType.DEBUG:
      return <IconFix size="xs" />;
    case BreadcrumbType.INFO:
      return <IconInfo size="xs" />;
    case BreadcrumbType.ERROR:
      return <IconFire size="xs" />;
    case BreadcrumbType.HTTP:
      return <IconSort size="xs" rotated />;
    case BreadcrumbType.WARNING:
      return <IconWarning size="xs" />;
    case BreadcrumbType.QUERY:
      return <IconStack size="xs" />;
    case BreadcrumbType.SYSTEM:
      return <IconMobile size="xs" />;
    case BreadcrumbType.SESSION:
      return <IconRefresh size="xs" />;
    case BreadcrumbType.TRANSACTION:
      return <IconSpan size="xs" />;
    default:
      return <IconTerminal size="xs" />;
  }
}
