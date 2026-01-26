from django.core.management.base import BaseCommand
from api.models import Calendar, Course, Student


class Command(BaseCommand):
    help = 'Debug: Show available calendars and students'

    def handle(self, *args, **options):
        self.stdout.write('\n=== CALENDARS ===')
        calendars = Calendar.objects.all()
        for cal in calendars:
            self.stdout.write(f'ID: {cal.id_calendar} | {cal} | Course: {cal.course.course_name}')

        self.stdout.write('\n=== COURSES ===')
        courses = Course.objects.all()
        for course in courses:
            count = Student.objects.filter(student_course=course).count()
            self.stdout.write(f'ID: {course.id_course} | {course.course_name} | Students: {count}')

        self.stdout.write('\n=== MEI STUDENTS ===')
        mei_course = Course.objects.filter(course_name__icontains='Mestrado em Engenharia Informática').first()
        if mei_course:
            mei_students = Student.objects.filter(student_course=mei_course)
            self.stdout.write(f'Total MEI students: {mei_students.count()}')
            for student in mei_students:
                self.stdout.write(f'  - {student.student_number}: {student.student_name}')
        else:
            self.stdout.write('MEI course not found!')
