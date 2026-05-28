from rest_framework import serializers


class TenantScopedSerializerMixin(serializers.ModelSerializer):
    """Inject tenant from request context on create."""

    def create(self, validated_data):
        request = self.context.get("request")
        if request and getattr(request, "tenant", None):
            validated_data["tenant"] = request.tenant
        return super().create(validated_data)


class TenantScopedViewMixin:
    """Filter queryset by request.tenant."""

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, "tenant", None)
        if tenant is None:
            return qs.none()
        return qs.filter(tenant=tenant)
