from rest_framework import serializers

from .models import ReviewDecision


class ReviewDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewDecision
        fields = ("id", "activity", "reviewer", "decision", "comment", "decided_at")
