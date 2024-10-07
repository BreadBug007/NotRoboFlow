import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        super().save(*args, **kwargs)


class User(AbstractUser, BaseModel):
    username = None
    email = models.EmailField(_("email address"), unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class Speaker(BaseModel):
    speaker_id = models.CharField(max_length=50, null=True, blank=True)
    audio_file = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.speaker_id} - {self.audio_file}"


class Media(BaseModel):
    speaker = models.ForeignKey(Speaker, on_delete=models.CASCADE)
    image_file = models.CharField(max_length=255, null=True, blank=True)
    text_file = models.CharField(max_length=255, null=True, blank=True)


class AllowedSpeaker(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    speaker = models.ForeignKey(Speaker, on_delete=models.CASCADE)


class Vowel(BaseModel):
    category_id = models.IntegerField(max_length=10, null=True, blank=True)
    vowel = models.CharField(max_length=10, null=True, blank=True)
    description = models.CharField(max_length=50, null=True, blank=True)


class Annotation(BaseModel):
    media = models.ForeignKey(Media, on_delete=models.CASCADE)
    annotation = models.JSONField(null=True, blank=True)
    is_annotated = models.BooleanField(default=False)
