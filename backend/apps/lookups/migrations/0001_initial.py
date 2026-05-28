import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("tenants", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="LookupAirport",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("iata_code", models.CharField(max_length=3, unique=True)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("country_code", models.CharField(blank=True, max_length=2)),
                ("lat", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("lon", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
            ],
            options={"db_table": "lookup_airports"},
        ),
        migrations.CreateModel(
            name="LookupPlant",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("plant_code", models.CharField(max_length=50)),
                ("plant_name", models.CharField(max_length=255)),
                ("country_code", models.CharField(blank=True, max_length=2)),
                ("is_active", models.BooleanField(default=True)),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="plants", to="tenants.tenant")),
            ],
            options={"db_table": "lookup_plants"},
        ),
        migrations.AlterUniqueTogether(
            name="lookupplant",
            unique_together={("tenant", "plant_code")},
        ),
    ]
