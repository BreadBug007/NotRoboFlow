from django.urls import path
from . import views

urlpatterns = [
    path('allowed-speaker', views.AllowedSpeakerView.as_view(), name="allowed-speaker"),
    path('allowed-media', views.AllowedMediaView.as_view(), name="allowed-media"),
    path('media-data/<uuid:media_id>', views.MediaDataView.as_view(), name="speaker-data"),
    path('vowels', views.VowelView.as_view(), name="vowels"),
    path('annotation', views.AnnotationView.as_view(), name="create-annotation"),
]
