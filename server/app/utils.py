import base64
import io
import os
import re

from django.conf import settings
from pydub import AudioSegment


def get_audio_segment(data):
    # Regex to extract timing
    regex = r'(\d+)-(\d+)_(\d+)-(\d+)'
    match = re.search(regex, data["image_file"])

    # Convert to seconds
    start_seconds = int(match.group(1)) + int(match.group(2)) / 100
    end_seconds = int(match.group(3)) + int(match.group(4)) / 100

    # Calculate start and end with buffer
    # Subtracting 3 seconds, ensuring no negative
    start_time = max(0, start_seconds - 2)
    end_time = end_seconds + 2  # Adding 2 seconds

    # Specify the start and end time in milliseconds (e.g., 10 seconds to 20 seconds)
    start_time = start_time * 1000  # 10 seconds
    end_time = end_time * 1000    # 20 seconds

    return start_time, end_time, start_seconds, end_seconds


def read_audio_segment(data, start_time, end_time):
    # Load the audio file
    audio = AudioSegment.from_file(os.path.join(
        settings.MEDIA_ROOT, data["audio_file"]))

    # Slice the audio
    segment = audio[start_time:end_time]
    buffer = io.BytesIO()
    segment.export(buffer, format="wav")
    return base64.b64encode(buffer.getvalue())
