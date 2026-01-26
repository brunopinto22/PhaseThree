from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Student, Course


class Command(BaseCommand):
    help = 'Change Pedro Costa and Ana Ferreira to MEI course'

    def handle(self, *args, **options):
        with transaction.atomic():
            try:
                # Get MEI course
                mei_course = Course.objects.filter(
                    course_name__icontains='Mestrado em Engenharia Informática'
                ).first()

                if not mei_course:
                    self.stdout.write(self.style.ERROR('MEI course not found!'))
                    return

                # Get Pedro Costa
                pedro = Student.objects.filter(student_name__icontains='Pedro Costa').first()
                
                # Get Ana Ferreira
                ana = Student.objects.filter(student_name__icontains='Ana Ferreira').first()

                if not pedro:
                    self.stdout.write(self.style.ERROR('Pedro Costa not found!'))
                    return

                if not ana:
                    self.stdout.write(self.style.ERROR('Ana Ferreira not found!'))
                    return

                # Change their course to MEI
                old_course_pedro = pedro.student_course.course_name
                pedro.student_course = mei_course
                pedro.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Changed {pedro.student_name} from {old_course_pedro} to {mei_course.course_name}'
                    )
                )

                old_course_ana = ana.student_course.course_name
                ana.student_course = mei_course
                ana.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Changed {ana.student_name} from {old_course_ana} to {mei_course.course_name}'
                    )
                )

                self.stdout.write(
                    self.style.SUCCESS('\n✓ Successfully changed both students to MEI course!')
                )

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
                raise
