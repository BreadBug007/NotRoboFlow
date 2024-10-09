import base64
import json
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
    is_annotated = serializers.SerializerMethodField()

    class Meta:
        model = models.Media
        fields = ('id', 'speaker_id', 'image_file', 'is_annotated')

    def get_is_annotated(self, obj):
        return models.Annotation.objects.filter(media_id=obj.id, is_annotated=True).exists()


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


class AnnotationCreateSerializer(serializers.Serializer):
    media_id = serializers.UUIDField()
    bounding_boxes = serializers.ListField()

    def validate(self, attrs):
        media = models.Media.objects.filter(id=attrs['media_id'])
        if not media.exists():
            raise serializers.ValidationError("Invalid media selected")
        categories = attrs['bounding_boxes']
        vowel_categories = models.Vowel.objects.filter(category_id__in=categories)
        if len(categories) != vowel_categories.count():
            raise serializers.ValidationError("Invalid vowels selected")
        return attrs

    def create(self, validated_data):
        media_id = validated_data["media_id"]
        models.Annotation.objects.update_or_create(
            media_id=media_id, defaults={
                "annotation": json.dumps(validated_data["bounding_boxes"]),
                "is_annotated": True
            }
        )
        return validated_data
