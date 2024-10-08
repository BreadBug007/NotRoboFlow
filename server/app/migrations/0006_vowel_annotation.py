# Generated by Django 5.1.1 on 2024-10-02 13:57

import django.db.models.deletion
import django.utils.timezone
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0005_speaker_speaker_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='Vowel',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('category_id', models.CharField(blank=True, max_length=10, null=True)),
                ('vowel', models.CharField(blank=True, max_length=10, null=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Annotation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('is_annotated', models.BooleanField(default=False)),
                ('media', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.media')),
                ('vowel', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.vowel')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
