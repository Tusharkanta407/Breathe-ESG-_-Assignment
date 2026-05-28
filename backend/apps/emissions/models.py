import uuid

from django.db import models

from apps.normalization.models import NormalizedActivity


class EmissionComputation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(NormalizedActivity, on_delete=models.CASCADE, related_name="emission_computations")
    factor_key = models.CharField(max_length=100)
    factor_source = models.CharField(max_length=100, default="baseline_v1")
    co2e_kg = models.DecimalField(max_digits=18, decimal_places=6)
    computation_version = models.CharField(max_length=20, default="v1")
    computed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "emission_computations"
