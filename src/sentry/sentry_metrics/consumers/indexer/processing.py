import logging
from typing import Any, Callable, Mapping

import sentry_kafka_schemas
from arroyo.types import Message
from sentry_kafka_schemas.schema_types.ingest_metrics_v1 import IngestMetric

from sentry.sentry_metrics.configuration import (
    IndexerStorage,
    MetricsIngestConfiguration,
    UseCaseKey,
)
from sentry.sentry_metrics.consumers.indexer.batch import IndexerBatch
from sentry.sentry_metrics.consumers.indexer.common import IndexerOutputMessageBatch, MessageBatch
from sentry.sentry_metrics.consumers.indexer.schema_validator import MetricsSchemaValidator
from sentry.sentry_metrics.consumers.indexer.tags_validator import (
    GenericMetricsTagsValidator,
    ReleaseHealthTagsValidator,
)
from sentry.sentry_metrics.indexer.base import StringIndexer
from sentry.sentry_metrics.indexer.limiters.cardinality import cardinality_limiter_factory
from sentry.sentry_metrics.indexer.mock import MockIndexer
from sentry.sentry_metrics.indexer.postgres.postgres_v2 import PostgresIndexer

logger = logging.getLogger(__name__)

STORAGE_TO_INDEXER: Mapping[IndexerStorage, Callable[[], StringIndexer]] = {
    IndexerStorage.POSTGRES: PostgresIndexer,
    IndexerStorage.MOCK: MockIndexer,
}

INGEST_CODEC: sentry_kafka_schemas.codecs.Codec[Any] = sentry_kafka_schemas.get_codec(
    "ingest-metrics"
)


class MessageProcessor:
    def __init__(self, config: MetricsIngestConfiguration):
        self._indexer = STORAGE_TO_INDEXER[config.db_backend](**config.db_backend_options)
        self._config = config

    # The following two methods are required to work such that the parallel
    # indexer can spawn subprocesses correctly.
    #
    # We get/set just the config (assuming it's pickleable) and re-instantiate
    # the indexer backend in the subprocess (assuming that it usually isn't)

    def __getstate__(self) -> MetricsIngestConfiguration:
        return self._config

    def __setstate__(self, config: MetricsIngestConfiguration) -> None:
        # mypy: "cannot access init directly"
        # yes I can, watch me.
        self.__init__(config)  # type: ignore

    def __get_tags_validator(self) -> Callable[[Mapping[str, str]], bool]:
        """
        Get the tags validator function for the current use case.
        """
        if self._config.use_case_id == UseCaseKey.RELEASE_HEALTH:
            return ReleaseHealthTagsValidator().is_allowed
        else:
            return GenericMetricsTagsValidator().is_allowed

    def __get_schema_validator(self) -> Callable[[str, IngestMetric], None]:
        """
        Get the schema validator function for the current use case.
        """
        return MetricsSchemaValidator(
            input_codec=INGEST_CODEC,
            validation_option=self._config.schema_validation_rule_option_name,
        ).validate

    def process_messages(self, outer_message: Message[MessageBatch]) -> IndexerOutputMessageBatch:
        return self._process_messages_impl(outer_message)

    def _process_messages_impl(
        self,
        outer_message: Message[MessageBatch],
    ) -> IndexerOutputMessageBatch:
        """
        We have an outer_message which contains a collection of Message() objects.
        Each of them represents a single message/metric on kafka.
            Message(
                payload=[Message(...), Message(...), etc]
            )

        The inner messages payloads are KafkaPayload's that have:
            * kafka meta data (partition/offsets)
            * key
            * headers
            * value

        The value of the message is what we need to parse and then translate
        using the indexer.

        We create an IndexerBatch object to:

        1. Parse and validate the inner messages from a sequence of bytes into
           Python objects (initalization)
        2. Filter messages (filter_messages)
        3. Create a collection of all the strings that needs to to be indexed
        (extract_strings)
        4. Take a mapping of string -> int (indexed strings), and replace all of
           the messages strings into ints
        """
        should_index_tag_values = self._config.should_index_tag_values
        is_output_sliced = self._config.is_output_sliced or False

        batch = IndexerBatch(
            outer_message,
            should_index_tag_values=should_index_tag_values,
            is_output_sliced=is_output_sliced,
            tags_validator=self.__get_tags_validator(),
            schema_validator=self.__get_schema_validator(),
        )

        cardinality_limiter = cardinality_limiter_factory.get_ratelimiter(self._config)
        cardinality_limiter_state = cardinality_limiter.check_cardinality_limits(
            self._config.use_case_id, batch.parsed_payloads_by_meta
        )

        batch.filter_messages(cardinality_limiter_state.keys_to_remove)

        extracted_strings = batch.extract_strings()

        record_result = self._indexer.bulk_record(extracted_strings)

        mapping = record_result.get_mapped_results()
        bulk_record_meta = record_result.get_fetch_metadata()

        results = batch.reconstruct_messages(mapping, bulk_record_meta)

        # TODO: move to separate thread
        cardinality_limiter.apply_cardinality_limits(cardinality_limiter_state)

        return results
