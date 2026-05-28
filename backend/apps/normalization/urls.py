from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NormalizedActivityViewSet

router = DefaultRouter()
router.register(r"", NormalizedActivityViewSet, basename="activity")

urlpatterns = [
    path("", include(router.urls)),
]
