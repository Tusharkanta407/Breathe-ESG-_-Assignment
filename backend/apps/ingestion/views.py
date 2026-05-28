from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ingestion.models import IngestionBatch
from apps.ingestion.serializers import IngestionBatchSerializer
from apps.ingestion.services import create_batch, ingest_sap_csv, ingest_travel_payload, ingest_utility_file
from apps.tenants.models import DataSource
from common.mixins import TenantScopedViewMixin
from common.permissions import HasTenantContext


class SapUploadView(APIView):
    permission_classes = [HasTenantContext]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        tenant = request.tenant
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        data_source = DataSource.objects.filter(tenant=tenant, source_type=DataSource.SourceType.SAP).first()
        if not data_source:
            return Response({"detail": "SAP data source not configured"}, status=status.HTTP_400_BAD_REQUEST)

        batch = create_batch(tenant, data_source, "manual_upload", input_ref=file.name)
        batch = ingest_sap_csv(batch, file.read())
        return Response(IngestionBatchSerializer(batch).data, status=status.HTTP_201_CREATED)


class UtilityUploadView(APIView):
    permission_classes = [HasTenantContext]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        tenant = request.tenant
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        data_source = DataSource.objects.filter(tenant=tenant, source_type=DataSource.SourceType.UTILITY).first()
        if not data_source:
            return Response({"detail": "Utility data source not configured"}, status=status.HTTP_400_BAD_REQUEST)

        is_zip = file.name.lower().endswith(".zip")
        batch = create_batch(tenant, data_source, "manual_upload", input_ref=file.name)
        batch = ingest_utility_file(batch, file.read(), is_zip=is_zip)
        return Response(IngestionBatchSerializer(batch).data, status=status.HTTP_201_CREATED)


class TravelSyncView(APIView):
    permission_classes = [HasTenantContext]
    parser_classes = [JSONParser]

    def post(self, request):
        tenant = request.tenant
        payload = request.data.get("bookings", request.data if isinstance(request.data, list) else [])
        if not payload:
            return Response({"detail": "bookings payload required"}, status=status.HTTP_400_BAD_REQUEST)

        data_source = DataSource.objects.filter(tenant=tenant, source_type=DataSource.SourceType.TRAVEL).first()
        if not data_source:
            return Response({"detail": "Travel data source not configured"}, status=status.HTTP_400_BAD_REQUEST)

        batch = create_batch(tenant, data_source, "scheduled_pull", input_ref="travel_sync")
        batch = ingest_travel_payload(batch, payload)
        return Response(IngestionBatchSerializer(batch).data, status=status.HTTP_201_CREATED)


class IngestionBatchViewSet(TenantScopedViewMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [HasTenantContext]
    serializer_class = IngestionBatchSerializer

    def get_queryset(self):
        qs = (
            IngestionBatch.objects.select_related("data_source")
            .annotate(row_count=Count("raw_records"))
            .order_by("-created_at")
        )
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return qs.none()
        return qs.filter(tenant=tenant)
