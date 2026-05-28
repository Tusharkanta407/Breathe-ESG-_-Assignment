from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DataSourceViewSet, TenantViewSet

router = DefaultRouter()
router.register(r"", TenantViewSet, basename="tenant")
router.register(r"data-sources", DataSourceViewSet, basename="datasource")

urlpatterns = [
    path("", include(router.urls)),
]
