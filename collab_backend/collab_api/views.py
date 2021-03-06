from .models import Song
from django.db.models import F
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.forms.models import model_to_dict
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer

from rest_framework.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
    HTTP_200_OK
)
from rest_framework.response import Response

from pydub import AudioSegment
import librosa
import json
import boto3
from botocore.client import Config
import logging
import numpy as np
import tempfile
import os
import base64

logger = logging.getLogger(__name__)
s3 = boto3.resource('s3')
s3_client = boto3.client('s3', config=Config(signature_version='s3v4'))
@csrf_exempt
@api_view(["POST"])
def save_songs(request):
    if request.method == 'POST':
        for bucket in s3.buckets.all():
            bname = bucket.name
        if request.FILES['song']:
            (os_file, track_path) = tempfile.mkstemp(suffix='.wav')
            sent_token = request.META['HTTP_AUTHORIZATION'].split()[1]
            token_obj = Token.objects.get(pk=sent_token)
            logger.error(token_obj.user)
            track = AudioSegment.from_file(request.FILES['song'], 'm4a').export(
                track_path, format='wav')  # convert to wav temp file
            logger.error(track_path)
            # open newly converted wav temporary file
            # user =  User.objects.get(pk = request)
            wav_song = open(track_path, 'rb')
            os.remove(track_path)
            song_record = Song(user=token_obj.user, name="song1")
            song_record.save()
            logger.error(song_record)
            s3.Bucket(bucket.name).put_object(
                Key=str(song_record.id)+'.wav', Body=wav_song)
            return Response({'message': 'success'}, status=HTTP_200_OK)
        else:
            return Response({'message': 'failure'}, status=HTTP_200_OK)
    return Response({'message': 'failure'}, status=HTTP_400_BAD_REQUEST)


def get_songs(request):
    if request.method == 'GET':
        # songs = list(Songs.objects.filter(song=song_id).values())
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        all_songs = list(Song.objects.all().values())
        logger.error(all_songs)
        response = Response(
            {'songs': all_songs}, content_type="application/json", status=HTTP_200_OK)
        response.accepted_renderer = JSONRenderer()
        response.accepted_media_type = "application/json"
        response.renderer_context = {}
        return response
    else:
        return HttpResponse(404)

@api_view(["GET"])
def load_song(request, song_id):
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
    return Response({"url": url})

@api_view(["GET"])
def delete_song(request, song_id):
    bucket_name = 'collab-song-storage'
    song = Song.objects.get(pk=song_id)
    key = str(song.id)+'.wav'
    song.delete()
    logger.error(key)

    url = s3_client.delete_object(
        Bucket='collab-song-storage',
        Key=key
    )
    return Response({"msg": "File deleted"})

@api_view(["GET"])
def analyze_song(request, song_id):
    (os_file, track_path) = tempfile.mkstemp(suffix='.wav')
    bucket_name = 'collab-song-storage'
    song = Song.objects.get(pk=song_id)
    key = str(song.id)+'.wav'
    logger.error(key)
    try:
        s3.Bucket('collab-song-storage').download_file(key, track_path)
    except:
        logger.error('Something went wrong trying to download the file')
        return JsonResponse({'msg': 'Oops'})
    else:
        logger.error('Successfully downloaded file from AWS to '+track_path)
    y, sr = librosa.load(track_path, mono=False)
    # CONVERT TO MONO AND REUPLOAD TO CLOUD
    y_mono = librosa.to_mono(y)
    # librosa.output.write_wav(track_path, y_mono, sr)
    # open_song = open(track_path, 'rb')
    # s3.Bucket('collab-song-storage').put_object(
    #     Key=key, Body=open_song)
    ##################
    # ESTIMATE TEMPO
    onset_env = librosa.onset.onset_strength(y=y_mono, sr=sr)
    tempo = list(librosa.beat.tempo(onset_envelope=onset_env, sr=sr))
    try:
        pitches, magnitudes = librosa.piptrack(y=y_mono, sr=sr)

    except:
        logger.error('Could not get pitches, magnitudes')
    if tempo[0] > 160:
        tempo.append(tempo[0]/2)
    elif tempo[0] < 70:
        tempo.append(tempo[0]*2)
    ##################
    try:
        os.remove(track_path)
    except:
        logger.error('Could not delete server file downloaded from AWS')
    else:
        logger.error('Downloaded file deleted from server files')
    half_step_mult = [1.05946, 1.12246, 1.18921, 1.25992, 1.33484,
                      1.41421, 1.49831, 1.5874, 1.68179, 1.78179, 1.88774, 2]
    freq_by_time = [{'t': y, 'f': pitches[x][y], 'm':magnitudes[x][y]} for x in range(
        len(pitches)) for y in range(len(pitches[x])) if magnitudes[x][y] > .1]
    freq_by_time.sort(key=lambda x: x['t'])
    sums = [sum(magnitudes[x]) for x in range(len(magnitudes))]
    max_indices = []
    for i in range(5):
        max_m = np.argmax(sums)
        max_indices.append(max_m)
        sums.pop(max_m)
    most_common_freq = [sum(pitches[max_index])/len(pitches[max_index])
                        for max_index in max_indices]
    return Response({"msg": "Completed analyze song", "tempo": list(map(lambda x: round(x, 2), tempo)), 'common_frequencies': list(map(lambda x: round(x, 2), most_common_freq))})

@csrf_exempt
@api_view(["POST"])
def log_out(request):
    sent_token = request.META['HTTP_AUTHORIZATION'].split()[1]
    Token.objects.filter(pk=sent_token).delete()
    return Response(status=HTTP_200_OK)


@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
def handle_login(request):
    auth = request.META['HTTP_AUTHORIZATION'].split()
    if auth[0].lower() == "basic":
        username, password = base64.b64decode(auth[1]).decode().split(':')
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid Credentials'}, status=HTTP_404_NOT_FOUND)
        token, _ = Token.objects.get_or_create(user=user)
        logger.error(token)
        return Response({'tokens': [{'type': 'access', 'value': token.key}], 'user': {'id': user.pk, 'username': user.username}}, status=HTTP_200_OK)


@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
def arb_api_call(request):
    sent_token = request.META['HTTP_AUTHORIZATION'].split()[1]
    logger.error(sent_token)
    token_obj = Token.objects.get(pk=sent_token)
    logger.error(token_obj.user.id)
    return Response({'message': 'success'}, status=HTTP_200_OK)


@csrf_exempt
def handle_registration(request):
    pass
