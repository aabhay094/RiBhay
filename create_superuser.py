import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ribhay.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'RiBhay')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'RiBhay.dev@gmail.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'AbhayRiya134')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' successfully created.")
else:
    print(f"Superuser '{username}' already exists.")
