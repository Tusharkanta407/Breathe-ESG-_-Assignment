import uuid

from django.db import models

from apps.tenants.models import DataSource, Tenant


class IngestionBatch(models.Model):
    class TriggerType(models.TextChoices):
        MANUAL_UPLOAD = "manual_upload", "Manual upload"
        SCHEDULED_PULL = "scheduled_pull", "Scheduled pull"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="ingestion_batches")
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="batches")
    trigger_type = models.CharField(max_length=20, choices=TriggerType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    input_ref = models.CharField(max_length=500, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    error_summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ingestion_batches"


class RawRecord(models.Model):
    class ParseStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PARSED = "parsed", "Parsed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(IngestionBatch, on_delete=models.CASCADE, related_name="raw_records")
    source_row_key = models.CharField(max_length=255, db_index=True)
    raw_payload = models.JSONField()
    parse_status = models.CharField(max_length=20, choices=ParseStatus.choices, default=ParseStatus.PENDING)
    parse_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "raw_records"
        unique_together = [["batch", "source_row_key"]]
