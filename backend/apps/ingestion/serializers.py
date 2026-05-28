from rest_framework import serializers

from .models import IngestionBatch, RawRecord


class IngestionBatchSerializer(serializers.ModelSerializer):
    source_type = serializers.CharField(source="data_source.source_type", read_only=True)
    row_count = serializers.SerializerMethodField()

    def get_row_count(self, obj) -> int:
        if hasattr(obj, "row_count"):
            return obj.row_count
        return obj.raw_records.count()

    class Meta:
        model = IngestionBatch
        fields = (
            "id",
            "tenant",
            "data_source",
            "source_type",
            "trigger_type",
            "status",
            "input_ref",
            "row_count",
            "started_at",
            "finished_at",
            "error_summary",
            "created_at",
        )


class RawRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawRecord
        fields = ("id", "batch", "source_row_key", "raw_payload", "parse_status", "parse_error", "created_at")
