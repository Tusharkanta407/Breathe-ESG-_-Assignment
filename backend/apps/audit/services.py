from apps.audit.models import AuditEvent


def log_event(tenant, entity_type: str, entity_id: str, event_type: str, actor_type: str, actor_id: str, payload: dict):
    return AuditEvent.objects.create(
        tenant=tenant,
        entity_type=entity_type,
        entity_id=entity_id,
        event_type=event_type,
        actor_type=actor_type,
        actor_id=actor_id,
        event_payload=payload or {},
    )
