from rest_framework import viewsets

from common.mixins import TenantScopedViewMixin
from common.permissions import HasTenantContext

from .models import AuditEvent
from .serializers import AuditEventSerializer


class AuditEventViewSet(TenantScopedViewMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [HasTenantContext]
    serializer_class = AuditEventSerializer

    def get_queryset(self):
        qs = AuditEvent.objects.all()
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return qs.none()
        qs = qs.filter(tenant=tenant)
        entity_id = self.request.query_params.get("entity_id")
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        return qs
