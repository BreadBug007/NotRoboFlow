from django.urls import path
from . import views

urlpatterns = [
    path('allowed-media', views.AllowedMedia.as_view(), name="allowed-media"),
    path('speaker-data/<uuid:speaker_id>', views.SpeakerData.as_view(), name="speaker-data"),
]
