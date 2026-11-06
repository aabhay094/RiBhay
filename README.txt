pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

Admin (/admin): Site settings (text + colours + logo), Projects, Team members
(photo, qualifications, certificates), Skill groups, Contact messages.
Agar "changes not reflected" warning aaye: python manage.py makemigrations core && python manage.py migrate
