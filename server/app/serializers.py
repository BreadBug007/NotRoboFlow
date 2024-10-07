import base64
import os

from django.conf import settings
from rest_framework import serializers

from . import models, utils


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
        start_time, end_time, start_seconds, end_seconds = utils.get_audio_segment(data)
        data["audio_file"] = utils.read_audio_segment(data, start_time, end_time)
        data["start_time"] = start_time / 1000
        data["end_time"] = end_time / 1000
        data["region_start"] = start_seconds
        data["region_end"] = end_seconds
        for file_type in ["image_file", "text_file"]:
            file_path = os.path.join(media_path, data[file_type])
            with open(file_path, "rb") as fp:
                data[f"{file_type}_name"] = data[file_type].split("\\")[-1]
                data[file_type] = base64.b64encode(fp.read())
        return data


class VowelListSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Vowel
        fields = ('id', 'category_id', 'vowel', 'description')
