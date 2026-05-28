from django.urls import path

from .views import PlantLookupView

urlpatterns = [
    path("plants/", PlantLookupView.as_view(), name="lookup-plant-create"),
]
