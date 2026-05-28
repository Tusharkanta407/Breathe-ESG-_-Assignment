import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("tenants", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("entity_type", models.CharField(max_length=50)),
                ("entity_id", models.CharField(max_length=64)),
                ("event_type", models.CharField(max_length=50)),
                ("actor_type", models.CharField(max_length=20)),
                ("actor_id", models.CharField(blank=True, max_length=64)),
                ("event_payload", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="audit_events", to="tenants.tenant")),
            ],
            options={"db_table": "audit_events", "ordering": ["-created_at"]},
        ),
    ]
