from django.urls import path

from . import views

urlpatterns = [
    path('announcements/', views.announcement_list, name='announcement-list'),
]
