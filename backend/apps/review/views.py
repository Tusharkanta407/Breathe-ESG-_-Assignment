from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.normalization.models import NormalizedActivity
from apps.normalization.serializers import NormalizedActivitySerializer
from apps.normalization.services import revalidate_activity
from apps.review.serializers import ReviewDecisionSerializer
from apps.review.services import approve_activity, reject_activity
from common.permissions import HasTenantContext


class ApproveActivityView(APIView):
    permission_classes = [HasTenantContext]

    def post(self, request, activity_id):
        try:
            activity = NormalizedActivity.objects.get(pk=activity_id, tenant=request.tenant)
        except NormalizedActivity.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if activity.is_locked:
            return Response({"detail": "Activity is locked"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decision = approve_activity(activity, request.user, request.data.get("comment", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ReviewDecisionSerializer(decision).data)


class RejectActivityView(APIView):
    permission_classes = [HasTenantContext]

    def post(self, request, activity_id):
        try:
            activity = NormalizedActivity.objects.get(pk=activity_id, tenant=request.tenant)
        except NormalizedActivity.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        decision = reject_activity(activity, request.user, request.data.get("comment", ""))
        return Response(ReviewDecisionSerializer(decision).data)


class RevalidateActivityView(APIView):
    permission_classes = [HasTenantContext]

    def post(self, request, activity_id):
        try:
            activity = NormalizedActivity.objects.get(pk=activity_id, tenant=request.tenant)
        except NormalizedActivity.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if activity.is_locked:
            return Response({"detail": "Activity is locked"}, status=status.HTTP_400_BAD_REQUEST)

        activity = revalidate_activity(activity)
        return Response(NormalizedActivitySerializer(activity).data)
