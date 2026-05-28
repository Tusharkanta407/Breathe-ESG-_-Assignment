import uuid

from django.db import models

from apps.ingestion.models import RawRecord
from apps.tenants.models import Tenant


class NormalizedActivity(models.Model):
    class ScopeCategory(models.TextChoices):
        SCOPE1 = "scope1", "Scope 1"
        SCOPE2 = "scope2", "Scope 2"
        SCOPE3 = "scope3", "Scope 3"

    class ActivityCategory(models.TextChoices):
        FUEL = "fuel", "Fuel"
        PROCUREMENT = "procurement", "Procurement"
        PURCHASED_ELECTRICITY = "purchased_electricity", "Purchased electricity"
        FLIGHT = "flight", "Flight"
        HOTEL = "hotel", "Hotel"
        GROUND_TRANSPORT = "ground_transport", "Ground transport"

    class ReviewStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="activities")
    raw_record = models.OneToOneField(RawRecord, on_delete=models.CASCADE, related_name="normalized_activity")
    source_type = models.CharField(max_length=20)
    source_entity_type = models.CharField(max_length=50, blank=True)
    activity_start = models.DateTimeField(null=True, blank=True)
    activity_end = models.DateTimeField(null=True, blank=True)
    activity_date = models.DateField(null=True, blank=True)
    scope_category = models.CharField(max_length=10, choices=ScopeCategory.choices, blank=True)
    activity_category = models.CharField(max_length=30, choices=ActivityCategory.choices, blank=True)
    quantity_value = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    quantity_unit_raw = models.CharField(max_length=20, blank=True)
    quantity_value_canonical = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    quantity_unit_canonical = models.CharField(max_length=20, blank=True)
    currency = models.CharField(max_length=3, blank=True)
    amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    facility_or_plant_code = models.CharField(max_length=50, blank=True)
    cost_center = models.CharField(max_length=50, blank=True)
    normalization_version = models.CharField(max_length=20, default="v1")
    review_status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    is_locked = models.BooleanField(default=False)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "normalized_activities"


class ValidationIssue(models.Model):
    class Severity(models.TextChoices):
        ERROR = "error", "Error"
        WARNING = "warning", "Warning"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(NormalizedActivity, on_delete=models.CASCADE, related_name="validation_issues")
    severity = models.CharField(max_length=10, choices=Severity.choices)
    issue_code = models.CharField(max_length=50)
    message = models.TextField()
    is_blocking = models.BooleanField(default=False)
    rule_version = models.CharField(max_length=20, default="v1")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "validation_issues"
