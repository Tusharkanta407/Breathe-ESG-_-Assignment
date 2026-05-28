from django.contrib import admin

from .models import DataSource, Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    search_fields = ("name", "slug")


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ("tenant", "source_type", "name", "is_active", "config_version")
    list_filter = ("source_type", "is_active")
