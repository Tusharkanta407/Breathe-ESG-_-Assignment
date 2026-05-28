from django.urls import path

from .views import ApproveActivityView, RejectActivityView, RevalidateActivityView

urlpatterns = [
    path("activities/<uuid:activity_id>/approve/", ApproveActivityView.as_view(), name="approve-activity"),
    path("activities/<uuid:activity_id>/reject/", RejectActivityView.as_view(), name="reject-activity"),
    path("activities/<uuid:activity_id>/revalidate/", RevalidateActivityView.as_view(), name="revalidate-activity"),
]
