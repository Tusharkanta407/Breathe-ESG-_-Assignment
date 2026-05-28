from apps.normalization.models import NormalizedActivity
from apps.normalization.rules import run_validation_rules


def revalidate_activity(activity: NormalizedActivity) -> NormalizedActivity:
    """Re-run validation rules after lookup fixes or data corrections."""
    run_validation_rules(activity)
    activity.refresh_from_db()
    return activity
