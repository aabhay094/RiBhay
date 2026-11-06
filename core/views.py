from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from .models import Project, SkillGroup, TeamMember, Certificate, ContactMessage


def _tech():
    out = []
    for g in SkillGroup.objects.all():
        out += g.item_list
    return out


def home(request):
    tech = _tech()
    stats = [
        dict(value=Project.objects.count(), suffix="+", label="Projects shipped"),
        dict(value=TeamMember.objects.count(), suffix="", label="Core team"),
        dict(value=Certificate.objects.count(), suffix="+", label="Certifications"),
        dict(value=len(tech), suffix="+", label="Technologies"),
    ]
    return render(request, "core/home.html", dict(
        projects=Project.objects.filter(featured=True)[:3], stats=stats,
        tech=tech, team=TeamMember.objects.all()))


def projects(request):
    return render(request, "core/projects.html", dict(projects=Project.objects.all()))


def project_detail(request, slug):
    p = get_object_or_404(Project, slug=slug)
    return render(request, "core/project_detail.html", dict(p=p, others=Project.objects.exclude(pk=p.pk)[:2]))


def about(request):
    return render(request, "core/about.html", dict(skills=SkillGroup.objects.all(), team=TeamMember.objects.all()))


def member(request, slug):
    m = get_object_or_404(TeamMember, slug=slug)
    return render(request, "core/member.html", dict(m=m))


def contact(request):
    if request.method == "POST":
        n, e, msg = (request.POST.get(k, "").strip() for k in ("name", "email", "message"))
        if n and e and msg:
            ContactMessage.objects.create(name=n, email=e, message=msg)
            messages.success(request, "Message sent. We'll get back to you soon.")
        else:
            messages.error(request, "Please fill in all fields.")
        return redirect("core:contact")
    return render(request, "core/contact.html")
