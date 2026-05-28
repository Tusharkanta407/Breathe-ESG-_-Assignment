from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import IngestionBatchViewSet, SapUploadView, TravelSyncView, UtilityUploadView

router = DefaultRouter()
router.register(r"batches", IngestionBatchViewSet, basename="ingestion-batch")

urlpatterns = [
    path("upload/sap/", SapUploadView.as_view(), name="upload-sap"),
    path("upload/utility/", UtilityUploadView.as_view(), name="upload-utility"),
    path("sync/travel/", TravelSyncView.as_view(), name="sync-travel"),
    path("", include(router.urls)),
]
