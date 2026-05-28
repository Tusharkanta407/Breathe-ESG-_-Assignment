from django.contrib.auth import get_user_model

from apps.audit.services import log_event
from apps.emissions.services import compute_emissions
from apps.normalization.models import NormalizedActivity
from apps.review.models import ReviewDecision

User = get_user_model()


def resolve_reviewer(user):
    """Use logged-in user, or demo analyst when API is open (no session auth)."""
    if user is not None and getattr(user, "is_authenticated", False):
        return user
    return User.objects.filter(username="analyst").first()


def approve_activity(activity: NormalizedActivity, reviewer, comment: str = "") -> ReviewDecision:
    reviewer = resolve_reviewer(reviewer)
    blocking = activity.validation_issues.filter(is_blocking=True).exists()
    if blocking:
        raise ValueError("Cannot approve activity with blocking validation issues")

    decision = ReviewDecision.objects.create(
        activity=activity,
        reviewer=reviewer,
        decision=ReviewDecision.Decision.APPROVE,
        comment=comment,
    )
    activity.review_status = NormalizedActivity.ReviewStatus.APPROVED
    activity.is_locked = True
    activity.save(update_fields=["review_status", "is_locked", "updated_at"])

    log_event(
        tenant=activity.tenant,
        entity_type="normalized_activity",
        entity_id=str(activity.id),
        event_type="approved",
        actor_type="user",
        actor_id=str(reviewer.pk) if reviewer else "analyst",
        payload={"comment": comment, "decision_id": str(decision.id)},
    )
    log_event(
        tenant=activity.tenant,
        entity_type="normalized_activity",
        entity_id=str(activity.id),
        event_type="locked",
        actor_type="system",
        actor_id="",
        payload={},
    )
    compute_emissions(activity)
    return decision


def reject_activity(activity: NormalizedActivity, reviewer, comment: str = "") -> ReviewDecision:
    reviewer = resolve_reviewer(reviewer)
    decision = ReviewDecision.objects.create(
        activity=activity,
        reviewer=reviewer,
        decision=ReviewDecision.Decision.REJECT,
        comment=comment,
    )
    activity.review_status = NormalizedActivity.ReviewStatus.REJECTED
    activity.is_locked = False
    activity.save(update_fields=["review_status", "is_locked", "updated_at"])

    log_event(
        tenant=activity.tenant,
        entity_type="normalized_activity",
        entity_id=str(activity.id),
        event_type="rejected",
        actor_type="user",
        actor_id=str(reviewer.pk) if reviewer else "analyst",
        payload={"comment": comment, "decision_id": str(decision.id)},
    )
    return decision
