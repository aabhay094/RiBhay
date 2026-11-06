from django.db import migrations


def seed(apps, schema_editor):
    S = apps.get_model("core", "SiteSettings")
    G = apps.get_model("core", "SkillGroup")
    P = apps.get_model("core", "Project")
    T = apps.get_model("core", "TeamMember")
    Q = apps.get_model("core", "Qualification")
    C = apps.get_model("core", "Certificate")
    S.objects.update_or_create(pk=1, defaults=dict(
        brand_name="RiBhay", eyebrow="RiBhay — Web Development Studio",
        hero_title="Building web products with", hero_highlight="precision", hero_title_end=", one component at a time.",
        hero_text="We build fast, responsive, and tailored websites designed to turn visitors into loyal customers. As a freelance web developer, we work directly with businesses to transform visual ideas into seamless, functional web realities.",
        about_text="RiBhay is a collaborative developer studio and tech initiative founded by Abhay Maurya and Riya Yadav. Based in Lucknow, India, we bridge the gap between creative web design, robust Django backends, and practical engineering solutions.",
        about_text2="Combining Computer Science and Diploma Engineering foundations, we build clean, scalable web applications, dynamic internal tools, and modern user experiences built to last.",
        cta_title="Have a project in mind?", cta_text="Open to freelance builds, internships, and collaborations.", cta_button="Say Hello",
        footer_text="Web development & digital builds — Django backends, clean front-ends, and the occasional circuit board on the side.",
        email="ribhay.dev@gmail.com", location="Lucknow, India"))
    for i, (l, it) in enumerate([("Backend", "Django · Python"), ("Frontend", "HTML · CSS · Bootstrap · JavaScript"),
                                 ("Languages", "Python · C++"), ("Design", "Graphic Design · Illustration"),
                                 ("Other", "Photography · Videography")]):
        G.objects.get_or_create(label=l, defaults=dict(items=it, order=i))
    P.objects.get_or_create(slug="aadya-beauty-hub", defaults=dict(
        title="Aadya Beauty Hub – Luxury Salon & Studio Website", category="Local Business", order=1,
        summary="A modern, responsive web application built for a luxury beauty studio. Features include appointment booking workflows, interactive WhatsApp integration, service listings (bridal artistry, rejuvenating facials, hair styling, nail care), and clean, elegant UI design tailored for local clients.",
        tags="Django, Python, HTML5, CSS3, Bootstrap, JavaScript"))
    P.objects.get_or_create(slug="web-and-whisk", defaults=dict(
        title="Web & Whisk – Food & Restaurant Web Application", category="Food & Restaurant", order=2,
        summary="A responsive full-stack restaurant and food ordering web application designed for browsing gourmet food categories, exploring discounted menu items, and booking dining tables seamlessly. Features dynamic catalog management, responsive UI design, and user authentication.",
        tags="Python, Django, HTML5, CSS3, Bootstrap, JavaScript, SQLite"))
    a = T.objects.get_or_create(slug="abhay", defaults=dict(
        name="Abhay Maurya", role="Full-Stack Developer & CSE Student", order=1,
        bio="I'm a Computer Science Engineering student passionate about crafting clean, efficient backends and sleek user interfaces. I bridge the gap between complex engineering concepts and intuitive web experiences — whether it's architecting Django backends or tinkering with custom hardware projects. Driven by curiosity, precision, and a knack for solving real-world problems.",
        github="https://github.com/aabhay094", linkedin="https://linkedin.com/in/aabhay094"))[0]
    r = T.objects.get_or_create(slug="riya", defaults=dict(
        name="Riya Yadav", role="Web Developer & IT Student", order=2,
        bio="Diploma student in Engineering with a passion for modern web development and software design. Focused on building responsive front-end interfaces, learning full-stack technologies, and turning ideas into clean, functional code. Eager to collaborate, learn, and build impactful digital experiences."))[0]
    if not Q.objects.exists():
        Q.objects.create(member=a, title="BTech in Computer Science", institute="Seth Vishambhar Nath Institute of Engineering & Technology (2029)",
                         note='Completed 45 Days Summer Training in Python with Django with "A++" Grade.')
        Q.objects.create(member=r, title="Diploma in IT", institute="Government Girls Polytechnic Lucknow (2028)",
                         note='Completed 30 Days Summer Training in Python with Django Framework with "A++" Grade.')
    if not C.objects.exists():
        C.objects.create(member=a, title="Python with Django", issuer="Techpile Technology Pvt. Ltd.", date_text="July 2026")
        C.objects.create(member=r, title="Python with Django", issuer="Softpro India Computer Technologies Pvt. Ltd.", date_text="July 2026")
        C.objects.create(member=r, title="AI Orientation Session – Industrial Visit", issuer="HCL GUVI Centre, Lucknow", date_text="2026-08-20")


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
