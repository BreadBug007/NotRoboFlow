from django.urls import path
from . import views

urlpatterns = [
    path('allowed-speaker', views.AllowedSpeaker.as_view(), name="allowed-speaker"),
    path('allowed-media', views.AllowedMedia.as_view(), name="allowed-media"),
    path('media-data/<uuid:media_id>', views.MediaData.as_view(), name="speaker-data"),
]
