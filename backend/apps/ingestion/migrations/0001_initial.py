import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("tenants", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="IngestionBatch",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("trigger_type", models.CharField(choices=[("manual_upload", "Manual upload"), ("scheduled_pull", "Scheduled pull")], max_length=20)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("running", "Running"), ("completed", "Completed"), ("failed", "Failed")], default="pending", max_length=20)),
                ("input_ref", models.CharField(blank=True, max_length=500)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("error_summary", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("data_source", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="batches", to="tenants.datasource")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="ingestion_batches", to="tenants.tenant")),
            ],
            options={"db_table": "ingestion_batches"},
        ),
        migrations.CreateModel(
            name="RawRecord",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("source_row_key", models.CharField(db_index=True, max_length=255)),
                ("raw_payload", models.JSONField()),
                ("parse_status", models.CharField(choices=[("pending", "Pending"), ("parsed", "Parsed"), ("failed", "Failed")], default="pending", max_length=20)),
                ("parse_error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("batch", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="raw_records", to="ingestion.ingestionbatch")),
            ],
            options={"db_table": "raw_records"},
        ),
        migrations.AlterUniqueTogether(
            name="rawrecord",
            unique_together={("batch", "source_row_key")},
        ),
    ]
