from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from . import models
from . import serializers
from .constants import Constants


class AllowedSpeaker(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        allowed_speakers = models.AllowedSpeaker.objects.filter(
            user=request.user
        ).select_related('speaker')
        serializer = serializers.AllowerSpeakerListSerializer(allowed_speakers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AllowedMedia(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        allowed_speakers = models.AllowedSpeaker.objects.filter(
            user=request.user
        ).values('speaker')
        allowed_media = models.Media.objects.filter(
            speaker__in=allowed_speakers
        )
        # filters
        speaker_id = request.query_params.get("speaker_id")
        annotated = request.query_params.get("annotated")
        if speaker_id:
            allowed_media = allowed_media.filter(speaker=speaker_id)
        if annotated:
            annotated_media = models.Annotation.objects.filter(
                media__speaker__in=allowed_speakers, is_annotated=True
            ).values('media')
            if annotated == Constants.ANNOTATED.value:
                allowed_media = allowed_media.filter(id__in=annotated_media)
            elif annotated == Constants.NON_ANNOTATED.value:
                allowed_media = allowed_media.exclude(id__in=annotated_media)
        serializer = serializers.AllowedMediaListSerializer(allowed_media, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MediaData(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, media_id):
        media_obj = models.Media.objects.filter(id=media_id).get()
        serializer = serializers.MediaDataRetrieveSerializer(media_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)
