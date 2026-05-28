import uuid

from django.conf import settings
from django.db import models

from apps.normalization.models import NormalizedActivity


class ReviewDecision(models.Model):
    class Decision(models.TextChoices):
        APPROVE = "approve", "Approve"
        REJECT = "reject", "Reject"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(NormalizedActivity, on_delete=models.CASCADE, related_name="review_decisions")
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="review_decisions",
    )
    decision = models.CharField(max_length=10, choices=Decision.choices)
    comment = models.TextField(blank=True)
    decided_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_decisions"
