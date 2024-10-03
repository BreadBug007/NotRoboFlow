from rest_framework import serializers

from . import models
from django.conf import settings
import base64
import os


class AllowerSpeakerListSerializer(serializers.Serializer):
    id = serializers.CharField(source="speaker.id")
    speaker_id = serializers.CharField(source="speaker.speaker_id")

    class Meta:
        fields = ('id', 'speaker_id')


class AllowedMediaListSerializer(serializers.ModelSerializer):
    speaker_id = serializers.CharField(source='speaker.speaker_id')

    class Meta:
        model = models.Media
        fields = ('id', 'speaker_id', 'image_file')


class MediaDataRetrieveSerializer(serializers.ModelSerializer):
    audio_file = serializers.CharField(source='speaker.audio_file')

    class Meta:
        model = models.Media
        fields = ('audio_file', 'image_file', 'text_file')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        media_path = settings.MEDIA_ROOT

        for file_type in ["audio_file", "image_file", "text_file"]:
            file_path = os.path.join(media_path, data[file_type])
            with open(file_path, "rb") as fp:
                data[file_type] = base64.b64encode(fp.read())
        return data
