from django.contrib import admin

from .models import IngestionBatch, RawRecord


class RawRecordInline(admin.TabularInline):
    model = RawRecord
    extra = 0
    readonly_fields = ("source_row_key", "parse_status", "created_at")


@admin.register(IngestionBatch)
class IngestionBatchAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "data_source", "status", "trigger_type", "created_at")
    list_filter = ("status", "trigger_type")
    inlines = [RawRecordInline]


@admin.register(RawRecord)
class RawRecordAdmin(admin.ModelAdmin):
    list_display = ("batch", "source_row_key", "parse_status", "created_at")
