from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import log_event
from common.permissions import HasTenantContext

from .models import LookupPlant
from .serializers import LookupPlantSerializer


class PlantLookupView(APIView):
    """Register a plant/facility code for the tenant (clears unknown_plant on revalidation)."""

    permission_classes = [HasTenantContext]

    def post(self, request):
        tenant = request.tenant
        code = (request.data.get("plant_code") or "").strip()
        if not code:
            return Response({"detail": "plant_code is required"}, status=status.HTTP_400_BAD_REQUEST)

        name = (request.data.get("plant_name") or code).strip()
        country = (request.data.get("country_code") or "").strip()[:2]

        plant, created = LookupPlant.objects.update_or_create(
            tenant=tenant,
            plant_code=code,
            defaults={"plant_name": name, "country_code": country, "is_active": True},
        )

        log_event(
            tenant=tenant,
            entity_type="lookup_plant",
            entity_id=str(plant.id),
            event_type="plant_registered" if created else "plant_updated",
            actor_type="user",
            actor_id=str(request.user.pk) if request.user and request.user.is_authenticated else "",
            payload={"plant_code": code, "plant_name": name},
        )

        return Response(
            LookupPlantSerializer(plant).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
