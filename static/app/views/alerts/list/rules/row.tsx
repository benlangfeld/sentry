import {useState} from 'react';
import styled from '@emotion/styled';

import Access from 'sentry/components/acl/access';
import ActorAvatar from 'sentry/components/avatar/actorAvatar';
import TeamAvatar from 'sentry/components/avatar/teamAvatar';
import AlertBadge from 'sentry/components/badge/alertBadge';
import {openConfirmModal} from 'sentry/components/confirm';
import DropdownAutoComplete from 'sentry/components/dropdownAutoComplete';
import type {ItemsBeforeFilter} from 'sentry/components/dropdownAutoComplete/types';
import DropdownBubble from 'sentry/components/dropdownBubble';
import type {MenuItemProps} from 'sentry/components/dropdownMenu';
import {DropdownMenu} from 'sentry/components/dropdownMenu';
import ErrorBoundary from 'sentry/components/errorBoundary';
import IdBadge from 'sentry/components/idBadge';
import Link from 'sentry/components/links/link';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import TextOverflow from 'sentry/components/textOverflow';
import TimeSince from 'sentry/components/timeSince';
import {Tooltip} from 'sentry/components/tooltip';
import {IconChevron, IconEllipsis, IconUser} from 'sentry/icons';
import {t, tct} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {Actor, Project} from 'sentry/types';
import {useUserTeams} from 'sentry/utils/useUserTeams';
import AlertRuleStatus from 'sentry/views/alerts/list/rules/alertRuleStatus';
import {hasActiveIncident} from 'sentry/views/alerts/list/rules/utils';

import type {CombinedMetricIssueAlerts} from '../../types';
import {CombinedAlertType, IncidentStatus} from '../../types';
import {isIssueAlert} from '../../utils';

type Props = {
  hasEditAccess: boolean;
  onDelete: (projectId: string, rule: CombinedMetricIssueAlerts) => void;
  onOwnerChange: (
    projectId: string,
    rule: CombinedMetricIssueAlerts,
    ownerValue: string
  ) => void;
  orgId: string;
  projects: Project[];
  projectsLoaded: boolean;
  rule: CombinedMetricIssueAlerts;
};

function RuleListRow({
  rule,
  projectsLoaded,
  projects,
  orgId,
  onDelete,
  onOwnerChange,
  hasEditAccess,
}: Props) {
  const {teams: userTeams} = useUserTeams();
  const [assignee, setAssignee] = useState<string>('');
  const activeIncident = hasActiveIncident(rule);

  function renderLastIncidentDate(): React.ReactNode {
    if (isIssueAlert(rule)) {
      if (!rule.lastTriggered) {
        return t('Alert not triggered yet');
      }
      return (
        <div>
          {t('Triggered ')}
          <TimeSince date={rule.lastTriggered} />
        </div>
      );
    }

    if (!rule.latestIncident) {
      return t('Alert not triggered yet');
    }

    if (activeIncident) {
      return (
        <div>
          {t('Triggered ')}
          <TimeSince date={rule.latestIncident.dateCreated} />
        </div>
      );
    }

    return (
      <div>
        {t('Resolved ')}
        <TimeSince date={rule.latestIncident.dateClosed!} />
      </div>
    );
  }

  const slug = rule.projects[0];
  const editLink = `/organizations/${orgId}/alerts/${
    isIssueAlert(rule) ? 'rules' : 'metric-rules'
  }/${slug}/${rule.id}/`;

  const duplicateLink = {
    pathname: `/organizations/${orgId}/alerts/new/${
      rule.type === CombinedAlertType.METRIC ? 'metric' : 'issue'
    }/`,
    query: {
      project: slug,
      duplicateRuleId: rule.id,
      createFromDuplicate: true,
      referrer: 'alert_stream',
    },
  };

  const ownerId = rule.owner?.split(':')[1];
  const teamActor = ownerId
    ? {type: 'team' as Actor['type'], id: ownerId, name: ''}
    : null;

  const canEdit = ownerId ? userTeams.some(team => team.id === ownerId) : true;

  const IssueStatusText: Record<IncidentStatus, string> = {
    [IncidentStatus.CRITICAL]: t('Critical'),
    [IncidentStatus.WARNING]: t('Warning'),
    [IncidentStatus.CLOSED]: t('Resolved'),
    [IncidentStatus.OPENED]: t('Resolved'),
  };

  const actions: MenuItemProps[] = [
    {
      key: 'edit',
      label: t('Edit'),
      to: editLink,
    },
    {
      key: 'duplicate',
      label: t('Duplicate'),
      to: duplicateLink,
    },
    {
      key: 'delete',
      label: t('Delete'),
      priority: 'danger',
      onAction: () => {
        openConfirmModal({
          onConfirm: () => onDelete(slug, rule),
          header: <h5>{t('Delete Alert Rule?')}</h5>,
          message: t(
            'Are you sure you want to delete "%s"? You won\'t be able to view the history of this alert once it\'s deleted.',
            rule.name
          ),
          confirmText: t('Delete Rule'),
          priority: 'danger',
        });
      },
    },
  ];

  function handleOwnerChange({value}: {value: string}) {
    const ownerValue = value && `team:${value}`;
    setAssignee(ownerValue);
    onOwnerChange(slug, rule, ownerValue);
  }

  const unassignedOption: ItemsBeforeFilter[number] = {
    value: '',
    label: (
      <MenuItemWrapper>
        <PaddedIconUser size="lg" />
        <Label>{t('Unassigned')}</Label>
      </MenuItemWrapper>
    ),
    searchKey: 'unassigned',
    actor: '',
    disabled: false,
  };

  const project = projects.find(p => p.slug === slug);
  const filteredProjectTeams = (project?.teams ?? []).filter(projTeam => {
    return userTeams.some(team => team.id === projTeam.id);
  });
  const dropdownTeams = filteredProjectTeams
    .map<ItemsBeforeFilter[number]>((team, idx) => ({
      value: team.id,
      searchKey: team.slug,
      label: (
        <MenuItemWrapper data-test-id="assignee-option" key={idx}>
          <IconContainer>
            <TeamAvatar team={team} size={24} />
          </IconContainer>
          <Label>#{team.slug}</Label>
        </MenuItemWrapper>
      ),
    }))
    .concat(unassignedOption);

  const teamId = assignee?.split(':')[1];
  const teamName = filteredProjectTeams.find(team => team.id === teamId);

  const assigneeTeamActor = assignee && {
    type: 'team' as Actor['type'],
    id: teamId,
    name: '',
  };

  const avatarElement = assigneeTeamActor ? (
    <ActorAvatar
      actor={assigneeTeamActor}
      className="avatar"
      size={24}
      tooltipOptions={{overlayStyle: {textAlign: 'left'}}}
      tooltip={tct('Assigned to [name]', {name: teamName && `#${teamName.name}`})}
    />
  ) : (
    <Tooltip isHoverable skipWrapper title={t('Unassigned')}>
      <PaddedIconUser size="lg" color="gray400" />
    </Tooltip>
  );

  return (
    <ErrorBoundary>
      <AlertNameWrapper isIssueAlert={isIssueAlert(rule)}>
        <AlertNameAndStatus>
          <AlertName>
            <Link
              to={
                isIssueAlert(rule)
                  ? `/organizations/${orgId}/alerts/rules/${rule.projects[0]}/${rule.id}/details/`
                  : `/organizations/${orgId}/alerts/rules/details/${rule.id}/`
              }
            >
              {rule.name}
            </Link>
          </AlertName>
          <AlertIncidentDate>{renderLastIncidentDate()}</AlertIncidentDate>
        </AlertNameAndStatus>
      </AlertNameWrapper>
      <FlexCenter>
        <FlexCenter>
          <Tooltip
            title={
              isIssueAlert(rule)
                ? t('Issue Alert')
                : tct('Metric Alert Status: [status]', {
                    status:
                      IssueStatusText[
                        rule?.latestIncident?.status ?? IncidentStatus.CLOSED
                      ],
                  })
            }
          >
            <AlertBadge
              status={rule?.latestIncident?.status}
              isIssue={isIssueAlert(rule)}
            />
          </Tooltip>
        </FlexCenter>
        <MarginLeft>
          <AlertRuleStatus rule={rule} />
        </MarginLeft>
      </FlexCenter>
      <FlexCenter>
        <ProjectBadgeContainer>
          <ProjectBadge
            avatarSize={18}
            project={projectsLoaded && project ? project : {slug}}
          />
        </ProjectBadgeContainer>
      </FlexCenter>

      <FlexCenter>
        {teamActor ? (
          <ActorAvatar actor={teamActor} size={24} />
        ) : (
          <AssigneeWrapper>
            {!projectsLoaded && <StyledLoadingIndicator mini />}
            {projectsLoaded && (
              <DropdownAutoComplete
                data-test-id="alert-row-assignee"
                maxHeight={400}
                onOpen={e => {
                  e?.stopPropagation();
                }}
                items={dropdownTeams}
                alignMenu="right"
                onSelect={handleOwnerChange}
                itemSize="small"
                searchPlaceholder={t('Filter teams')}
                disableLabelPadding
                emptyHidesInput
                disabled={!hasEditAccess}
              >
                {({getActorProps, isOpen}) => (
                  <DropdownButton {...getActorProps({})}>
                    {avatarElement}
                    {hasEditAccess && (
                      <StyledChevron direction={isOpen ? 'up' : 'down'} size="xs" />
                    )}
                  </DropdownButton>
                )}
              </DropdownAutoComplete>
            )}
          </AssigneeWrapper>
        )}
      </FlexCenter>
      <ActionsColumn>
        <Access access={['alerts:write']}>
          {({hasAccess}) => (
            <DropdownMenu
              items={actions}
              position="bottom-end"
              triggerProps={{
                'aria-label': t('Actions'),
                size: 'xs',
                icon: <IconEllipsis />,
                showChevron: false,
              }}
              disabledKeys={hasAccess && canEdit ? [] : ['delete']}
            />
          )}
        </Access>
      </ActionsColumn>
    </ErrorBoundary>
  );
}

// TODO: see static/app/components/profiling/flex.tsx and utilize the FlexContainer styled component
const FlexCenter = styled('div')`
  display: flex;
  align-items: center;
`;

const AlertNameWrapper = styled('div')<{isIssueAlert?: boolean}>`
  ${p => p.theme.overflowEllipsis}
  display: flex;
  align-items: center;
  gap: ${space(2)};
  ${p => p.isIssueAlert && `padding: ${space(3)} ${space(2)}; line-height: 2.4;`}
`;

const AlertNameAndStatus = styled('div')`
  ${p => p.theme.overflowEllipsis}
  line-height: 1.35;
`;

const AlertName = styled('div')`
  ${p => p.theme.overflowEllipsis}
  font-size: ${p => p.theme.fontSizeLarge};
`;

const AlertIncidentDate = styled('div')`
  color: ${p => p.theme.gray300};
`;

const ProjectBadgeContainer = styled('div')`
  width: 100%;
`;

const ProjectBadge = styled(IdBadge)`
  flex-shrink: 0;
`;

const ActionsColumn = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${space(1)};
`;

const AssigneeWrapper = styled('div')`
  display: flex;
  justify-content: flex-end;

  /* manually align menu underneath dropdown caret */
  ${DropdownBubble} {
    right: -14px;
  }
`;

const DropdownButton = styled('div')`
  display: flex;
  align-items: center;
  font-size: 20px;
`;

const StyledChevron = styled(IconChevron)`
  margin-left: ${space(1)};
`;

const PaddedIconUser = styled(IconUser)`
  padding: ${space(0.25)};
`;

const IconContainer = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${p => p.theme.iconSizes.lg};
  height: ${p => p.theme.iconSizes.lg};
  flex-shrink: 0;
`;

const MenuItemWrapper = styled('div')`
  display: flex;
  align-items: center;
  font-size: ${p => p.theme.fontSizeSmall};
`;

const Label = styled(TextOverflow)`
  margin-left: ${space(0.75)};
`;

const MarginLeft = styled('div')`
  margin-left: ${space(1)};
`;

const StyledLoadingIndicator = styled(LoadingIndicator)`
  height: 24px;
  margin: 0;
  margin-right: ${space(1.5)};
`;

export default RuleListRow;
