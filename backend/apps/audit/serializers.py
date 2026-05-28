from rest_framework import serializers

from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvent
        fields = (
            "id",
            "tenant",
            "entity_type",
            "entity_id",
            "event_type",
            "actor_type",
            "actor_id",
            "event_payload",
            "created_at",
        )
