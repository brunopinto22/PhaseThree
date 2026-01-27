
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestor_estagios.settings')
django.setup()

from api.models import Student

sid = 2021222222
try:
    s = Student.objects.get(student_number=sid)
    print(f"SUCCESS: Student {sid} exists. Name: {s.student_name}")
    print(f"Course ID: {s.student_course.id_course if s.student_course else 'None'}")
    print(f"Branch ID: {s.student_branch.id_branch if s.student_branch else 'None'}")
    print(f"Calendar ID: {s.calendar.id_calendar if s.calendar else 'None'}")
except Student.DoesNotExist:
    print(f"FAILURE: Student {sid} does NOT exist.")
except Exception as e:
    print(f"ERROR: {e}")
