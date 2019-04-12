from django.urls import path
from django.conf import settings


from . import views

app_name = 'collab_api'
urlpatterns = [
    path('song/<str:song_id>/', views.songs, name='song')
]
