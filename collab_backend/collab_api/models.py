from django.db import models

# Create your models here.
class Song(models.Model):
    @classmethod
    def create(cls, **kwargs):
        song = cls(user=kwargs['user'], name=kwargs['name'])
        song.save()
        return song

    user = models.CharField(max_length=30)
    name = models.CharField(max_length=30, default='song')