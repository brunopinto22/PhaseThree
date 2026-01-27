from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import (
    Calendar, Course, Proposal, Company, Teacher
)


class Command(BaseCommand):
    help = 'Add existing company and advisor to MEI proposals'

    def handle(self, *args, **options):
        with transaction.atomic():
            try:
                # Get MEI calendar
                mei_calendar = Calendar.objects.filter(
                    course__course_name__icontains='Mestrado em Engenharia Informática'
                ).first()

                if not mei_calendar:
                    self.stdout.write(self.style.ERROR('MEI Calendar not found!'))
                    return

                # Get MEI course
                mei_course = mei_calendar.course

                # Get an existing company
                company = Company.objects.first()
                if not company:
                    self.stdout.write(self.style.ERROR('No companies found in database!'))
                    return

                self.stdout.write(f'Using existing company: {company.company_name}')

                # Get any teacher to be advisor
                teacher = Teacher.objects.first()
                if not teacher:
                    self.stdout.write(self.style.ERROR('No teachers found in database!'))
                    return

                self.stdout.write(f'Using teacher as advisor: {teacher.teacher_name}')

                # Find MEI proposals
                proposals = Proposal.objects.filter(calendar=mei_calendar)

                for proposal in proposals:
                    # Add company if not set
                    if not proposal.company:
                        proposal.company = company
                        self.stdout.write(f'Added company to proposal: {proposal.proposal_title}')

                    # Add advisor if not set
                    if not proposal.isec_advisor:
                        proposal.isec_advisor = teacher
                        self.stdout.write(f'Added advisor to proposal: {proposal.proposal_title}')

                    proposal.save()

                self.stdout.write(
                    self.style.SUCCESS('\n✓ Successfully updated MEI proposals with company and advisor!')
                )

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
                raise
