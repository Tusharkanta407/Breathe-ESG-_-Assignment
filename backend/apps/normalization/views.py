from django.db.models import Count

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.ingestion.models import IngestionBatch, RawRecord
from common.mixins import TenantScopedViewMixin
from common.permissions import HasTenantContext

from .models import NormalizedActivity
from .serializers import NormalizedActivitySerializer


class NormalizedActivityViewSet(TenantScopedViewMixin, viewsets.ReadOnlyModelViewSet):
    permission_classes = [HasTenantContext]
    serializer_class = NormalizedActivitySerializer

    def get_queryset(self):
        qs = NormalizedActivity.objects.select_related("raw_record").prefetch_related(
            "validation_issues", "emission_computations"
        )
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return qs.none()
        qs = qs.filter(tenant=tenant)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(review_status=status_param)
        suspicious = self.request.query_params.get("suspicious")
        if suspicious == "true":
            qs = qs.filter(validation_issues__severity="warning").distinct()
        if self.request.query_params.get("blocking") == "true":
            qs = qs.filter(validation_issues__is_blocking=True).distinct()
        return qs

    @action(detail=False, methods=["get"])
    def summary(self, request):
        tenant = getattr(request, "tenant", None)
        base_qs = NormalizedActivity.objects.filter(tenant=tenant) if tenant else NormalizedActivity.objects.none()
        qs = self.get_queryset()

        pending_qs = base_qs.filter(review_status=NormalizedActivity.ReviewStatus.PENDING)
        pending_blocking = pending_qs.filter(validation_issues__is_blocking=True).distinct().count()
        ready_to_approve = (
            pending_qs.exclude(validation_issues__is_blocking=True).distinct().count()
        )

        ingestion = {
            "total_batches": 0,
            "completed_batches": 0,
            "failed_batches": 0,
            "total_raw_rows": 0,
            "by_source": {},
        }
        if tenant:
            batches = IngestionBatch.objects.filter(tenant=tenant)
            ingestion["total_batches"] = batches.count()
            ingestion["completed_batches"] = batches.filter(
                status=IngestionBatch.Status.COMPLETED
            ).count()
            ingestion["failed_batches"] = batches.filter(status=IngestionBatch.Status.FAILED).count()
            ingestion["total_raw_rows"] = RawRecord.objects.filter(batch__tenant=tenant).count()
            for row in base_qs.values("source_type").annotate(count=Count("id")):
                ingestion["by_source"][row["source_type"]] = row["count"]

        return Response(
            {
                "total": base_qs.count(),
                "pending": pending_qs.count(),
                "approved": base_qs.filter(
                    review_status=NormalizedActivity.ReviewStatus.APPROVED
                ).count(),
                "rejected": base_qs.filter(
                    review_status=NormalizedActivity.ReviewStatus.REJECTED
                ).count(),
                "with_blocking_issues": base_qs.filter(
                    validation_issues__is_blocking=True
                ).distinct().count(),
                "pending_blocking": pending_blocking,
                "ready_to_approve": ready_to_approve,
                "suspicious": base_qs.filter(validation_issues__severity="warning").distinct().count(),
                "failed_batches": ingestion["failed_batches"],
                "ingestion": ingestion,
            }
        )
