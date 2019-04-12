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

import json
import boto3
import logging

logger = logging.getLogger(__name__)
s3 = boto3.resource('s3')
@csrf_exempt
def songs(request, song_id):
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
            s3.Bucket(bucket.name).put_object(Key='audio.m4a', Body=request.FILES['song'])
            return JsonResponse({"msg":"guud"}, safe=False)
        else:
            return JsonResponse({"msg":"not guud"}, safe=False)
    return HttpResponse(404)
