from .models import Song
from django.template import loader
from django.db.models import F
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.views import generic
from django.forms.models import model_to_dict
from django.views.decorators.csrf import csrf_exempt
import json

import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def songs(request, song_id):
    if request.method == 'GET':
        # songs = list(Songs.objects.filter(song=song_id).values())
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        return JsonResponse({"song": "everlong"}, safe=False)
    if request.method == 'POST':
        new_song = Song(location = json.loads(request.body)["location"])
        new_song.save()
        return JsonResponse({"status":200, "msg":"Location saved"})
    return HttpResponse(404)
