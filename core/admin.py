from django.contrib import admin
from .models import SiteSettings, SkillGroup, Project, TeamMember, Qualification, Certificate, ContactMessage

admin.site.site_header = "RiBhay Admin"
admin.site.site_title = "RiBhay Admin"


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Brand & colours", {"fields": ("brand_name", "logo", "primary_color", "secondary_color")}),
        ("Hero (home top)", {"fields": ("eyebrow", "hero_title", "hero_highlight", "hero_title_end", "hero_text")}),
        ("About", {"fields": ("about_text", "about_text2")}),
        ("Call to action", {"fields": ("cta_title", "cta_text", "cta_button")}),
        ("Footer & contact", {"fields": ("footer_text", "email", "location")}),
    )

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SkillGroup)
class SkillGroupAdmin(admin.ModelAdmin):
    list_display = ("label", "items", "order")
    list_editable = ("order",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "featured", "order")
    list_editable = ("featured", "order")
    prepopulated_fields = {"slug": ("title",)}


class QualInline(admin.TabularInline):
    model = Qualification
    extra = 0


class CertInline(admin.StackedInline):
    model = Certificate
    extra = 0


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "order")
    list_editable = ("order",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [QualInline, CertInline]


@admin.register(ContactMessage)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created")
    readonly_fields = ("created",)
