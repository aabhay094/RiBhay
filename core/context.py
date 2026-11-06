import re
from .models import SiteSettings, TeamMember


def _rgb(h, fallback):
    h = (h or "").lstrip("#")
    if not re.fullmatch(r"[0-9a-fA-F]{6}", h):
        h = fallback
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def _s(c):
    return " ".join(str(v) for v in c)


def _light(c, t=0.35):
    return [round(v + (255 - v) * t) for v in c]


def site(request):
    s = SiteSettings.load()
    c1, c2 = _rgb(s.primary_color, "10B981"), _rgb(s.secondary_color, "6366F1")
    return {
        "site": s,
        "footer_team": TeamMember.objects.all(),
        "colors": {"c1": _s(c1), "c1l": _s(_light(c1)), "c2": _s(c2), "c2l": _s(_light(c2))},
    }
