import uuid

from django.db import models

from apps.tenants.models import Tenant


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="audit_events")
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=64)
    event_type = models.CharField(max_length=50)
    actor_type = models.CharField(max_length=20)
    actor_id = models.CharField(max_length=64, blank=True)
    event_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_events"
        ordering = ["-created_at"]
