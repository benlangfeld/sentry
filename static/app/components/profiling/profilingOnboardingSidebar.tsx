import {useEffect, useMemo, useState} from 'react';
import styled from '@emotion/styled';
import partition from 'lodash/partition';

import {CompactSelect} from 'sentry/components/compactSelect';
import IdBadge from 'sentry/components/idBadge';
import {SdkDocumentation} from 'sentry/components/onboarding/gettingStartedDoc/sdkDocumentation';
import {ProductSolution} from 'sentry/components/onboarding/productSelection';
import {TaskSidebar} from 'sentry/components/sidebar/taskSidebar';
import type {CommonSidebarProps} from 'sentry/components/sidebar/types';
import {SidebarPanelKey} from 'sentry/components/sidebar/types';
import {ALL_ACCESS_PROJECTS} from 'sentry/constants/pageFilters';
import platforms from 'sentry/data/platforms';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {SelectValue} from 'sentry/types/core';
import type {Project} from 'sentry/types/project';
import {trackAnalytics} from 'sentry/utils/analytics';
import {getDocsPlatformSDKForPlatform} from 'sentry/utils/profiling/platforms';
import useOrganization from 'sentry/utils/useOrganization';
import usePageFilters from 'sentry/utils/usePageFilters';
import useProjects from 'sentry/utils/useProjects';

function splitProjectsByProfilingSupport(projects: Project[]): {
  supported: Project[];
  unsupported: Project[];
} {
  const [supported, unsupported] = partition(
    projects,
    project => project.platform && getDocsPlatformSDKForPlatform(project.platform)
  );

  return {supported, unsupported};
}

const PROFILING_ONBOARDING_STEPS = [
  ProductSolution.PERFORMANCE_MONITORING,
  ProductSolution.PROFILING,
];

export function ProfilingOnboardingSidebar(props: CommonSidebarProps) {
  if (props.currentPanel !== SidebarPanelKey.PROFILING_ONBOARDING) {
    return null;
  }

  return <ProfilingOnboarding {...props} />;
}

function ProfilingOnboarding(props: CommonSidebarProps) {
  const pageFilters = usePageFilters();
  const organization = useOrganization();
  const {projects} = useProjects();

  const [currentProject, setCurrentProject] = useState<Project | undefined>();

  const {supported: supportedProjects, unsupported: unsupportedProjects} = useMemo(
    () => splitProjectsByProfilingSupport(projects),
    [projects]
  );

  useEffect(() => {
    if (currentProject) return;

    // we'll only ever select an unsupportedProject if they do not have a supported project in their organization
    if (supportedProjects.length === 0 && unsupportedProjects.length > 0) {
      if (pageFilters.selection.projects[0] === ALL_ACCESS_PROJECTS) {
        setCurrentProject(unsupportedProjects[0]);
        return;
      }

      setCurrentProject(
        // there's an edge case where an org w/ a single project may be unsupported but for whatever reason there is no project selection so we can't select a project
        // in those cases we'll simply default to the first unsupportedProject
        unsupportedProjects.find(
          p => p.id === String(pageFilters.selection.projects[0])
        ) ?? unsupportedProjects[0]
      );
      return;
    }
    // if it's My Projects or All Projects, pick the first supported project
    if (
      pageFilters.selection.projects.length === 0 ||
      pageFilters.selection.projects[0] === ALL_ACCESS_PROJECTS
    ) {
      setCurrentProject(supportedProjects[0]);
      return;
    }

    // if it's a list of projects, pick the first one that's supported
    const supportedProjectsById = supportedProjects.reduce((mapping, project) => {
      mapping[project.id] = project;
      return mapping;
    }, {});

    for (const projectId of pageFilters.selection.projects) {
      if (supportedProjectsById[String(projectId)]) {
        setCurrentProject(supportedProjectsById[String(projectId)]);
        return;
      }
    }
  }, [
    currentProject,
    pageFilters.selection.projects,
    supportedProjects,
    unsupportedProjects,
  ]);

  const projectSelectOptions = useMemo(() => {
    const supportedProjectItems: SelectValue<string>[] = supportedProjects.map(
      project => {
        return {
          value: project.id,
          textValue: project.id,
          label: (
            <StyledIdBadge project={project} avatarSize={16} hideOverflow disableLink />
          ),
        };
      }
    );

    const unsupportedProjectItems: SelectValue<string>[] = unsupportedProjects.map(
      project => {
        return {
          value: project.id,
          textValue: project.id,
          label: (
            <StyledIdBadge project={project} avatarSize={16} hideOverflow disableLink />
          ),
          disabled: true,
        };
      }
    );
    return [
      {
        label: t('Supported'),
        options: supportedProjectItems,
      },
      {
        label: t('Unsupported'),
        options: unsupportedProjectItems,
      },
    ];
  }, [supportedProjects, unsupportedProjects]);

  const currentPlatform = currentProject?.platform
    ? platforms.find(p => p.id === currentProject.platform)
    : undefined;

  return (
    <TaskSidebar
      orientation={props.orientation}
      collapsed={props.collapsed}
      hidePanel={() => {
        trackAnalytics('profiling_views.onboarding_action', {
          organization,
          action: 'dismissed',
        });
        props.hidePanel();
      }}
    >
      <Content>
        <Heading>{t('Profile Code')}</Heading>
        <div
          onClick={e => {
            // we need to stop bubbling the CompactSelect click event
            // failing to do so will cause the sidebar panel to close
            // the event.target will be unmounted by the time the panel listener
            // receives the event and assume the click was outside the panel
            e.stopPropagation();
          }}
        >
          <CompactSelect
            triggerLabel={
              currentProject ? (
                <StyledIdBadge
                  project={currentProject}
                  avatarSize={16}
                  hideOverflow
                  disableLink
                />
              ) : (
                t('Select a project')
              )
            }
            value={currentProject?.id}
            onChange={opt => setCurrentProject(projects.find(p => p.id === opt.value))}
            triggerProps={{'aria-label': currentProject?.slug}}
            options={projectSelectOptions}
            position="bottom-end"
          />
        </div>
        {currentProject && currentPlatform ? (
          <SdkDocumentation
            activeProductSelection={PROFILING_ONBOARDING_STEPS}
            organization={organization}
            platform={currentPlatform}
            projectId={currentProject.id}
            projectSlug={currentProject.slug}
          />
        ) : null}
      </Content>
    </TaskSidebar>
  );
}

const Content = styled('div')`
  padding: ${space(2)};
`;

const Heading = styled('div')`
  display: flex;
  color: ${p => p.theme.activeText};
  font-size: ${p => p.theme.fontSizeExtraSmall};
  text-transform: uppercase;
  font-weight: ${p => p.theme.fontWeightBold};
  line-height: 1;
  margin-top: ${space(3)};
`;

const StyledIdBadge = styled(IdBadge)`
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 1;
`;
