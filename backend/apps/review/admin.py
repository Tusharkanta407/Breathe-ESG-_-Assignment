from django.contrib import admin

from .models import ReviewDecision


@admin.register(ReviewDecision)
class ReviewDecisionAdmin(admin.ModelAdmin):
    list_display = ("activity", "decision", "reviewer", "decided_at")
