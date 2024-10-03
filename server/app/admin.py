from django.contrib import admin
from . import models


class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email')
    search_fields = ('email', 'first_name', 'last_name')


class SpeakerAdmin(admin.ModelAdmin):
    list_display = ('id', 'audio_file')
    search_fields = ('audio_file',)


class MediaAdmin(admin.ModelAdmin):
    list_display = ('id', 'speaker', 'image_file', 'text_file')
    search_fields = ('speaker_id', 'image_file', 'text_file')


class AllowedSpeakerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'speaker')
    search_fields = ('user__email', 'speaker_id')


class VowelAdmin(admin.ModelAdmin):
    list_display = ('id', 'category_id', 'vowel')
    search_fields = ('category_id', 'vowel')


class AnnotationAdmin(admin.ModelAdmin):
    list_display = ('id', 'media', 'vowel', 'is_annotated')


admin.site.register(models.User, UserAdmin)
admin.site.register(models.Speaker, SpeakerAdmin)
admin.site.register(models.Media, MediaAdmin)
admin.site.register(models.AllowedSpeaker, AllowedSpeakerAdmin)
admin.site.register(models.Vowel, VowelAdmin)
admin.site.register(models.Annotation, AnnotationAdmin)
