import uuid

from apps.tenants.models import Tenant


class TenantMiddleware:
    """Attach tenant from X-Tenant-ID header for API requests."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = None
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            try:
                uuid.UUID(str(tenant_id).strip())
                request.tenant = Tenant.objects.get(pk=tenant_id, is_active=True)
            except (Tenant.DoesNotExist, ValueError, AttributeError, TypeError):
                request.tenant = None
        return self.get_response(request)
