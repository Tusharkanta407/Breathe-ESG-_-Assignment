from django.contrib import admin

from .models import LookupAirport, LookupPlant


@admin.register(LookupPlant)
class LookupPlantAdmin(admin.ModelAdmin):
    list_display = ("tenant", "plant_code", "plant_name", "is_active")


@admin.register(LookupAirport)
class LookupAirportAdmin(admin.ModelAdmin):
    list_display = ("iata_code", "city", "country_code")
