from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Song(models.Model):
    @classmethod
    def create(cls, **kwargs):
        song = cls(user=kwargs['user'], name=kwargs['name'])
        song.save()
        return song

    name = models.CharField(max_length=30)
    user = models.ForeignKey(User, on_delete=models.CASCADE)