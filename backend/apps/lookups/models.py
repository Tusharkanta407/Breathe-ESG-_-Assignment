import uuid

from django.db import models

from apps.tenants.models import Tenant


class LookupPlant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="plants")
    plant_code = models.CharField(max_length=50)
    plant_name = models.CharField(max_length=255)
    country_code = models.CharField(max_length=2, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "lookup_plants"
        unique_together = [["tenant", "plant_code"]]


class LookupAirport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    iata_code = models.CharField(max_length=3, unique=True)
    city = models.CharField(max_length=100, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        db_table = "lookup_airports"
