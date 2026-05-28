from rest_framework import viewsets

from common.mixins import TenantScopedViewMixin
from common.permissions import HasTenantContext

from .models import DataSource, Tenant
from .serializers import DataSourceSerializer, TenantSerializer


class TenantViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tenant.objects.filter(is_active=True)
    serializer_class = TenantSerializer


class DataSourceViewSet(TenantScopedViewMixin, viewsets.ModelViewSet):
    permission_classes = [HasTenantContext]
    serializer_class = DataSourceSerializer

    def get_queryset(self):
        return DataSource.objects.select_related("tenant")
