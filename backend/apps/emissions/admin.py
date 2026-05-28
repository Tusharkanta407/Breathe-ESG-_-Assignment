from django.contrib import admin

from .models import EmissionComputation


@admin.register(EmissionComputation)
class EmissionComputationAdmin(admin.ModelAdmin):
    list_display = ("activity", "factor_key", "co2e_kg", "computed_at")
