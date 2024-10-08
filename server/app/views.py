from django.conf import settings
from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from . import models, serializers
from .constants import Constants


class AllowedSpeakerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        allowed_speakers = models.AllowedSpeaker.objects.filter(
            user=request.user
        ).select_related('speaker')
        serializer = serializers.AllowerSpeakerListSerializer(allowed_speakers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AllowedMediaView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        allowed_speakers = models.AllowedSpeaker.objects.filter(
            user=request.user
        ).values('speaker')
        allowed_media = models.Media.objects.filter(
            speaker__in=allowed_speakers
        ).order_by('speaker__speaker_id')
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
        queryset = self.paginate_queryset(allowed_media)
        serializer = serializers.AllowedMediaListSerializer(queryset, many=True)
        return self.get_paginated_response(serializer.data)


class MediaDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, media_id):
        media_obj = models.Media.objects.filter(id=media_id).get()
        serializer = serializers.MediaDataRetrieveSerializer(media_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VowelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = models.Vowel.objects.all()
        serializer = serializers.VowelListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnnotationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = serializers.AnnotationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
