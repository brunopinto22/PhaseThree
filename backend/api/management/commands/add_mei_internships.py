from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import date
from api.models import (
    Student, Calendar, Course, Proposal, Candidature, CandidatureProposal
)


class Command(BaseCommand):
    help = 'Adds 2 students with internships to MEI calendar'

    def handle(self, *args, **options):
        with transaction.atomic():
            try:
                # Get LEI and MEI calendars
                lei_calendar = Calendar.objects.filter(
                    course__course_name__icontains='Licenciatura em Engenharia Informática'
                ).first()

                mei_calendar = Calendar.objects.filter(
                    course__course_name__icontains='Mestrado em Engenharia Informática'
                ).first()

                if not lei_calendar:
                    self.stdout.write(self.style.ERROR('LEI Calendar not found!'))
                    return

                if not mei_calendar:
                    self.stdout.write(self.style.ERROR('MEI Calendar not found!'))
                    return

                self.stdout.write(f'Found LEI Calendar: {lei_calendar}')
                self.stdout.write(f'Found MEI Calendar: {mei_calendar}')

                # Get LEI course
                lei_course = lei_calendar.course

                # Get students from LEI that already have internship in LEI
                lei_students_with_internship = Student.objects.filter(
                    student_course=lei_course,
                    students_candidatures__state__in=['placed', 'protocol_generated', 'presidency_signature', 'company_signature', 'student_signature', 'finished'],
                    students_candidatures__candidature_proposals__proposal__calendar=lei_calendar
                ).distinct()

                self.stdout.write(f'LEI students with internship: {lei_students_with_internship.count()}')

                # Get LEI students WITHOUT internship in LEI
                lei_students_without_internship = Student.objects.filter(
                    student_course=lei_course
                ).exclude(
                    student_number__in=lei_students_with_internship.values_list('student_number', flat=True)
                )[:2]

                if len(lei_students_without_internship) < 2:
                    self.stdout.write(
                        self.style.ERROR(
                            f'Not enough LEI students without internship! Found: {len(lei_students_without_internship)}'
                        )
                    )
                    return

                self.stdout.write(f'Found {len(lei_students_without_internship)} LEI students without internship')

                # Get MEI course
                mei_course = mei_calendar.course

                # Create proposal for MEI without company
                proposal, created = Proposal.objects.get_or_create(
                    calendar=mei_calendar,
                    proposal_title='Internship MEI - Added Test',
                    defaults={
                        'proposal_description': 'Test proposal for MEI students',
                        'proposal_selection_method': 'CV',
                        'proposal_type': 1,  # Internship
                        'course': mei_course,
                        'work_format': '1',  # On-site
                        'location': 'Lisbon',
                        'schedule': 'Full-time',
                        'slots': 5,
                        'proposal_submission_date': date.today(),
                        'company': None,
                    }
                )

                if created:
                    self.stdout.write(f'Created proposal: {proposal.proposal_title}')
                else:
                    self.stdout.write(f'Using existing proposal: {proposal.proposal_title}')

                # Add internships for the 2 students with different states
                states = ['placed', 'protocol_generated']  # Different states for each student
                
                for idx, (student, state) in enumerate(zip(lei_students_without_internship, states), 1):
                    # Create candidature
                    candidature, cand_created = Candidature.objects.get_or_create(
                        student=student,
                        defaults={
                            'state': state,
                            'candidature_submission_date': date.today(),
                        }
                    )

                    if cand_created:
                        self.stdout.write(f'Created candidature for {student.student_name} with state: {state}')
                    else:
                        # Update state if it already exists
                        candidature.state = state
                        candidature.save()
                        self.stdout.write(f'Updated candidature for {student.student_name} to state: {state}')

                    # Create candidature-proposal link
                    cand_prop, cp_created = CandidatureProposal.objects.get_or_create(
                        candidature=candidature,
                        proposal=proposal,
                        defaults={'state': 'accepted'}
                    )

                    if cp_created:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ Student {idx}: {student.student_name} (LEI) now has internship in MEI (state: {state})'
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f'⚠ Student {idx}: {student.student_name} already linked to this proposal'
                            )
                        )

                self.stdout.write(
                    self.style.SUCCESS('✓ Successfully added 2 students with internships to MEI!')
                )

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
                raise
