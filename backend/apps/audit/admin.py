from django.contrib import admin

from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "entity_type", "entity_id", "tenant", "created_at")
    list_filter = ("event_type", "entity_type")
