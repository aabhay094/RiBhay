import re
from django.db import models


class SiteSettings(models.Model):
    """Single row - edit everything on the site from Admin > Site settings."""
    brand_name = models.CharField(max_length=60, blank=True)
    eyebrow = models.CharField(max_length=100, blank=True)
    hero_title = models.CharField(max_length=120, blank=True)
    hero_highlight = models.CharField(max_length=60, blank=True)
    hero_title_end = models.CharField(max_length=120, blank=True)
    hero_text = models.TextField(blank=True)
    about_text = models.TextField(blank=True)
    about_text2 = models.TextField(blank=True)
    cta_title = models.CharField(max_length=100, blank=True)
    cta_text = models.CharField(max_length=200, blank=True)
    cta_button = models.CharField(max_length=40, blank=True)
    footer_text = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    primary_color = models.CharField(max_length=7, default="#10B981")
    secondary_color = models.CharField(max_length=7, default="#6366F1")
    logo = models.ImageField(upload_to="branding/", blank=True)

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    @classmethod
    def load(cls):
        return cls.objects.get_or_create(pk=1)[0]

    def __str__(self):
        return "Site settings"


class SkillGroup(models.Model):
    label = models.CharField(max_length=60)
    items = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    @property
    def item_list(self):
        return [i.strip() for i in re.split(r"[,·]", self.items) if i.strip()]

    def __str__(self):
        return self.label


class Project(models.Model):
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    category = models.CharField(max_length=60, default="Web App")
    summary = models.TextField(blank=True)
    description = models.TextField(blank=True)
    tags = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="projects/", blank=True)
    live_url = models.URLField(blank=True)
    source_url = models.URLField(blank=True)
    featured = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "-id"]

    @property
    def tag_list(self):
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    @property
    def variant(self):
        return (self.pk or 0) % 4 + 1

    def __str__(self):
        return self.title


class TeamMember(models.Model):
    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=80)
    role = models.CharField(max_length=120, blank=True)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="team/", blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    @property
    def first_name(self):
        return self.name.split()[0]

    def __str__(self):
        return self.name


class Qualification(models.Model):
    member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name="qualifications")
    title = models.CharField(max_length=120)
    institute = models.CharField(max_length=160, blank=True)
    note = models.CharField(max_length=250, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class Certificate(models.Model):
    member = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name="certificates")
    title = models.CharField(max_length=160)
    issuer = models.CharField(max_length=160, blank=True)
    date_text = models.CharField(max_length=60, blank=True)
    image = models.ImageField(upload_to="certificates/", blank=True)
    verify_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return f"{self.name} <{self.email}>"
