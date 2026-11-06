import django.db.models.deletion
from django.db import migrations, models


def _id():
    return ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"))


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(name="SiteSettings", fields=[
            _id(),
            ("brand_name", models.CharField(blank=True, max_length=60)),
            ("eyebrow", models.CharField(blank=True, max_length=100)),
            ("hero_title", models.CharField(blank=True, max_length=120)),
            ("hero_highlight", models.CharField(blank=True, max_length=60)),
            ("hero_title_end", models.CharField(blank=True, max_length=120)),
            ("hero_text", models.TextField(blank=True)),
            ("about_text", models.TextField(blank=True)),
            ("about_text2", models.TextField(blank=True)),
            ("cta_title", models.CharField(blank=True, max_length=100)),
            ("cta_text", models.CharField(blank=True, max_length=200)),
            ("cta_button", models.CharField(blank=True, max_length=40)),
            ("footer_text", models.TextField(blank=True)),
            ("email", models.EmailField(blank=True, max_length=254)),
            ("location", models.CharField(blank=True, max_length=100)),
            ("primary_color", models.CharField(default="#10B981", max_length=7)),
            ("secondary_color", models.CharField(default="#6366F1", max_length=7)),
            ("logo", models.ImageField(blank=True, upload_to="branding/")),
        ], options={"verbose_name": "Site settings", "verbose_name_plural": "Site settings"}),
        migrations.CreateModel(name="SkillGroup", fields=[
            _id(),
            ("label", models.CharField(max_length=60)),
            ("items", models.CharField(max_length=200)),
            ("order", models.PositiveIntegerField(default=0)),
        ], options={"ordering": ["order", "id"]}),
        migrations.CreateModel(name="Project", fields=[
            _id(),
            ("title", models.CharField(max_length=120)),
            ("slug", models.SlugField(max_length=140, unique=True)),
            ("category", models.CharField(default="Web App", max_length=60)),
            ("summary", models.TextField(blank=True)),
            ("description", models.TextField(blank=True)),
            ("tags", models.CharField(blank=True, max_length=200)),
            ("image", models.ImageField(blank=True, upload_to="projects/")),
            ("live_url", models.URLField(blank=True)),
            ("source_url", models.URLField(blank=True)),
            ("featured", models.BooleanField(default=True)),
            ("order", models.PositiveIntegerField(default=0)),
        ], options={"ordering": ["order", "-id"]}),
        migrations.CreateModel(name="TeamMember", fields=[
            _id(),
            ("slug", models.SlugField(unique=True)),
            ("name", models.CharField(max_length=80)),
            ("role", models.CharField(blank=True, max_length=120)),
            ("bio", models.TextField(blank=True)),
            ("photo", models.ImageField(blank=True, upload_to="team/")),
            ("github", models.URLField(blank=True)),
            ("linkedin", models.URLField(blank=True)),
            ("email", models.EmailField(blank=True, max_length=254)),
            ("order", models.PositiveIntegerField(default=0)),
        ], options={"ordering": ["order", "id"]}),
        migrations.CreateModel(name="Qualification", fields=[
            _id(),
            ("title", models.CharField(max_length=120)),
            ("institute", models.CharField(blank=True, max_length=160)),
            ("note", models.CharField(blank=True, max_length=250)),
            ("order", models.PositiveIntegerField(default=0)),
            ("member", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="qualifications", to="core.teammember")),
        ], options={"ordering": ["order", "id"]}),
        migrations.CreateModel(name="Certificate", fields=[
            _id(),
            ("title", models.CharField(max_length=160)),
            ("issuer", models.CharField(blank=True, max_length=160)),
            ("date_text", models.CharField(blank=True, max_length=60)),
            ("image", models.ImageField(blank=True, upload_to="certificates/")),
            ("verify_url", models.URLField(blank=True)),
            ("order", models.PositiveIntegerField(default=0)),
            ("member", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="certificates", to="core.teammember")),
        ], options={"ordering": ["order", "id"]}),
        migrations.CreateModel(name="ContactMessage", fields=[
            _id(),
            ("name", models.CharField(max_length=100)),
            ("email", models.EmailField(max_length=254)),
            ("message", models.TextField()),
            ("created", models.DateTimeField(auto_now_add=True)),
        ], options={"ordering": ["-created"]}),
    ]
