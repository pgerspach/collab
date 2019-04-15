from .models import Song
from django.template import loader
from django.db.models import F
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.views import generic
from django.forms.models import model_to_dict
from django.views.decorators.csrf import csrf_exempt
from wsgiref.util import FileWrapper
from django.core.files import File
from .forms import UploadFileForm
from pydub import AudioSegment
import json
import boto3
from botocore.client import Config
import logging
import asyncio
import tempfile
import os
logger = logging.getLogger(__name__)
s3 = boto3.resource('s3')
s3_client = boto3.client('s3', config=Config(signature_version='s3v4'))
@csrf_exempt
def save_songs(request):
    if request.method == 'GET':
        # songs = list(Songs.objects.filter(song=song_id).values())
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        return JsonResponse({"song": "everlong"}, safe=False)
    if request.method == 'POST':
        for bucket in s3.buckets.all():
            bname = bucket.name
        if request.FILES['song']:
            (os_file, track_path) = tempfile.mkstemp(suffix='.wav')
            track = AudioSegment.from_file(request.FILES['song'], 'm4a').export(
                track_path, format='wav')  # conver to wav temp file
            logger.error(track_path)

    # open newly converted wav temporary file
            wav_song = open(track_path, 'rb')
            song_record = Song.create(user="user1", name="song1")
            logger.error(song_record)
            s3.Bucket(bucket.name).put_object(
                Key=str(song_record.id)+'.wav', Body=wav_song)
            os.remove(track_path)
            return JsonResponse({"msg": "guud"}, safe=False)
        else:
            return JsonResponse({"msg": "not guud"}, safe=False)
    return HttpResponse(404)


def get_songs(request):
    if request.method == 'GET':
        # songs = list(Songs.objects.filter(song=song_id).values())
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        all_songs = list(Song.objects.all().values())
        logger.error(all_songs)
        return JsonResponse(all_songs, safe=False)

    else:
        return HttpResponse(404)


def load_song(request, song_id):
    if request.method == 'POST':
        # songs = list(Songs.objects.filter(song=song_id).values())
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        return HttpResponse(404)
    bucket_name = 'collab-song-storage'
    song = Song.objects.get(pk=song_id)
    key = str(song.id)+'.wav'
    logger.error(key)

    url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': 'collab-song-storage',
            'Key': key
        }
    )
    return JsonResponse({"url": url})
