from django.contrib import admin

from .models import NormalizedActivity, ValidationIssue


class ValidationIssueInline(admin.TabularInline):
    model = ValidationIssue
    extra = 0


@admin.register(NormalizedActivity)
class NormalizedActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "activity_category", "scope_category", "review_status", "is_locked")
    list_filter = ("review_status", "scope_category", "activity_category", "is_locked")
    inlines = [ValidationIssueInline]
