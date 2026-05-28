import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("ingestion", "0001_initial"),
        ("tenants", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="NormalizedActivity",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("source_type", models.CharField(max_length=20)),
                ("source_entity_type", models.CharField(blank=True, max_length=50)),
                ("activity_start", models.DateTimeField(blank=True, null=True)),
                ("activity_end", models.DateTimeField(blank=True, null=True)),
                ("activity_date", models.DateField(blank=True, null=True)),
                ("scope_category", models.CharField(blank=True, choices=[("scope1", "Scope 1"), ("scope2", "Scope 2"), ("scope3", "Scope 3")], max_length=10)),
                ("activity_category", models.CharField(blank=True, choices=[("fuel", "Fuel"), ("procurement", "Procurement"), ("purchased_electricity", "Purchased electricity"), ("flight", "Flight"), ("hotel", "Hotel"), ("ground_transport", "Ground transport")], max_length=30)),
                ("quantity_value", models.DecimalField(blank=True, decimal_places=6, max_digits=18, null=True)),
                ("quantity_unit_raw", models.CharField(blank=True, max_length=20)),
                ("quantity_value_canonical", models.DecimalField(blank=True, decimal_places=6, max_digits=18, null=True)),
                ("quantity_unit_canonical", models.CharField(blank=True, max_length=20)),
                ("currency", models.CharField(blank=True, max_length=3)),
                ("amount", models.DecimalField(blank=True, decimal_places=2, max_digits=18, null=True)),
                ("facility_or_plant_code", models.CharField(blank=True, max_length=50)),
                ("cost_center", models.CharField(blank=True, max_length=50)),
                ("normalization_version", models.CharField(default="v1", max_length=20)),
                ("review_status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=20)),
                ("is_locked", models.BooleanField(default=False)),
                ("version", models.PositiveIntegerField(default=1)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("raw_record", models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="normalized_activity", to="ingestion.rawrecord")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="activities", to="tenants.tenant")),
            ],
            options={"db_table": "normalized_activities"},
        ),
        migrations.CreateModel(
            name="ValidationIssue",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("severity", models.CharField(choices=[("error", "Error"), ("warning", "Warning")], max_length=10)),
                ("issue_code", models.CharField(max_length=50)),
                ("message", models.TextField()),
                ("is_blocking", models.BooleanField(default=False)),
                ("rule_version", models.CharField(default="v1", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("activity", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="validation_issues", to="normalization.normalizedactivity")),
            ],
            options={"db_table": "validation_issues"},
        ),
    ]
