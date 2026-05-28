import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("normalization", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="EmissionComputation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("factor_key", models.CharField(max_length=100)),
                ("factor_source", models.CharField(default="baseline_v1", max_length=100)),
                ("co2e_kg", models.DecimalField(decimal_places=6, max_digits=18)),
                ("computation_version", models.CharField(default="v1", max_length=20)),
                ("computed_at", models.DateTimeField(auto_now_add=True)),
                ("activity", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="emission_computations", to="normalization.normalizedactivity")),
            ],
            options={"db_table": "emission_computations"},
        ),
    ]
