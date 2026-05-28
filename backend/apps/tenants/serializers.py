from rest_framework import serializers

from .models import DataSource, Tenant


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ("id", "name", "slug", "is_active", "created_at")


class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = (
            "id",
            "tenant",
            "source_type",
            "name",
            "is_active",
            "config_version",
            "config",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
