from rest_framework.permissions import BasePermission


class HasTenantContext(BasePermission):
    def has_permission(self, request, view):
        return getattr(request, "tenant", None) is not None
