from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger"),
    path("api/tenants/", include("apps.tenants.urls")),
    path("api/ingestion/", include("apps.ingestion.urls")),
    path("api/activities/", include("apps.normalization.urls")),
    path("api/review/", include("apps.review.urls")),
    path("api/audit/", include("apps.audit.urls")),
    path("api/emissions/", include("apps.emissions.urls")),
    path("api/lookups/", include("apps.lookups.urls")),
]
