from django.urls import path
from . import views
app_name = "core"
urlpatterns = [
    path("", views.home, name="home"),
    path("projects/", views.projects, name="projects"),
    path("projects/<slug:slug>/", views.project_detail, name="project_detail"),
    path("about/", views.about, name="about"),
    path("team/<slug:slug>/", views.member, name="member"),
    path("contact/", views.contact, name="contact"),
]
