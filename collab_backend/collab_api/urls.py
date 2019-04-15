from django.urls import path
from django.conf import settings


from . import views

app_name = 'collab_api'
urlpatterns = [
    path('song/save/', views.save_songs, name='song'),
    path('song/get/', views.get_songs, name='song'),
    path('song/load/<int:song_id>', views.load_song, name='song')
]
