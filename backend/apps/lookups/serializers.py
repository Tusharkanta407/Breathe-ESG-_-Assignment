from rest_framework import serializers

from .models import LookupPlant


class LookupPlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = LookupPlant
        fields = ("id", "plant_code", "plant_name", "country_code", "is_active")
