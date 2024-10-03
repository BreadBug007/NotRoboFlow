from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from . import models
from . import serializers
from .constants import Constants

class AllowedMedia(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        allowed_speakers = models.AllowedSpeaker.objects.filter(
            user=request.user
        ).values('speaker')
        allowed_media = models.Media.objects.filter(
            speaker__in=allowed_speakers
        )
        annotated_media = models.Annotation.objects.filter(
            media__speaker__in=allowed_speakers, is_annotated=True
        ).values('media')
        media_filter = request.query_params.get("media_filter")
        if media_filter:
            if media_filter == Constants.ANNOTATED.value:
                allowed_media = allowed_media.filter(id__in=annotated_media)
            elif media_filter == Constants.NON_ANNOTATED.value:
                allowed_media = allowed_media.exclude(id__in=annotated_media)
        serializer = serializers.AllowedMediaListSerializer(allowed_media, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SpeakerData(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, speaker_id):
        queryset = models.Media.objects.filter(speaker=speaker_id).get()
        serializer = serializers.SpeakerDataListSerializer(queryset)
        return Response(serializer.data, status=status.HTTP_200_OK)
