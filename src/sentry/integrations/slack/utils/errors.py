import logging
from dataclasses import dataclass

from slack_sdk.errors import SlackApiError, SlackRequestError

_logger = logging.getLogger(__name__)


@dataclass(frozen=True, eq=True)
class SlackSdkErrorCategory:
    message: str
    check_body: bool = False


SLACK_SDK_ERROR_CATEGORIES = (
    RATE_LIMITED := SlackSdkErrorCategory("ratelimited"),
    CHANNEL_NOT_FOUND := SlackSdkErrorCategory("channel_not_found"),
    EXPIRED_URL := SlackSdkErrorCategory("Expired url", check_body=True),
)

_CATEGORIES_BY_MESSAGE = {c.message: c for c in SLACK_SDK_ERROR_CATEGORIES}


def unpack_slack_api_error(exc: SlackApiError | SlackRequestError) -> SlackSdkErrorCategory | None:
    if isinstance(exc, SlackApiError):
        try:
            error_attr = exc.response["error"]
            return _CATEGORIES_BY_MESSAGE[error_attr]
        except KeyError:
            pass

    dump = str(exc)
    category = _CATEGORIES_BY_MESSAGE.get(dump.split("\n")[0])
    if category:
        return category

    for category in SLACK_SDK_ERROR_CATEGORIES:
        if category.check_body and category.message in dump:
            return category

    # Indicate that a new value needs to be added to SLACK_SDK_ERROR_CATEGORIES
    _logger.warning("unrecognized_slack_api_message", extra={"slack_api_message": dump})
    return None
