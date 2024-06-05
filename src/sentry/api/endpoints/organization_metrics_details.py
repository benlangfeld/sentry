from rest_framework.request import Request
from rest_framework.response import Response

from sentry.api.api_owners import ApiOwner
from sentry.api.api_publish_status import ApiPublishStatus
from sentry.api.base import region_silo_endpoint
from sentry.api.bases import OrganizationAndStaffPermission, OrganizationEndpoint
from sentry.exceptions import InvalidParams
from sentry.sentry_metrics.querying.metadata import get_metrics_meta
from sentry.sentry_metrics.use_case_utils import get_use_case_ids


@region_silo_endpoint
class OrganizationMetricsDetailsEndpoint(OrganizationEndpoint):
    publish_status = {
        "GET": ApiPublishStatus.EXPERIMENTAL,
    }
    owner = ApiOwner.TELEMETRY_EXPERIENCE
    permission_classes = (OrganizationAndStaffPermission,)

    """Get the metadata of all the stored metrics including metric name, available operations and metric unit"""

    def get(self, request: Request, organization) -> Response:
        projects = self.get_projects(request, organization)
        if not projects:
            raise InvalidParams("You must supply at least one project to see its metrics")

        metrics = get_metrics_meta(
            organization=organization, projects=projects, use_case_ids=get_use_case_ids(request)
        )

        return Response(metrics, status=200)
