from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import date, datetime, timedelta
from api.models import (
    Accounts, ScientificArea, Course, Branch, Teacher, Student,
    Company, Representative, Settings, Module, Permissions,
    Calendar, Proposal, Candidature, CandidatureProposal
)


class Command(BaseCommand):
    help = 'Seeds the database with sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )
        parser.add_argument(
            '--with-test-data',
            action='store_true',
            help='Also create test calendars, proposals, and candidatures',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            # Delete in proper order to avoid foreign key constraints
            CandidatureProposal.objects.all().delete()
            Candidature.objects.all().delete()
            Proposal.objects.all().delete()
            Calendar.objects.all().delete()
            Student.objects.all().delete()
            Representative.objects.all().delete()
            Company.objects.all().delete()
            Teacher.objects.all().delete()
            Course.objects.all().delete()
            ScientificArea.objects.all().delete()
            # Keep admin user and Settings

        self.stdout.write(self.style.SUCCESS('Starting to seed database...'))

        with transaction.atomic():
            # Get or create Settings
            settings = Settings.objects.first()
            if not settings:
                settings = Settings.objects.create(
                    support_email="estagios-lei@isec.pt",
                    student_password="aluno@123",
                    teacher_password="docente@123",
                    representative_password="representante@123",
                )

            # Create Academic Services User
            self.stdout.write('Creating Academic Services user...')
            academic_services_email = "servicos_academicos@isec.pt"
            academic_services_username = "academic_services"
            academic_services_password = "servicos_academicos@123"
            
            # Remove old academic services users if they exist
            old_emails = ["academic_services@test.com", academic_services_email]
            deleted = Accounts.objects.filter(email__in=old_emails).delete()
            if deleted[0] > 0:
                self.stdout.write(f'  Removed {deleted[0]} old academic_services users')
            
            # Create the academic services user
            if not Accounts.objects.filter(email=academic_services_email).exists():
                academic_user = Accounts.objects.create_user(
                    username=academic_services_username,
                    email=academic_services_email,
                    password=academic_services_password,
                    user_type="academic_services"
                )
                self.stdout.write(self.style.SUCCESS(f'  Created: Academic Services ({academic_services_email})'))

            # Create Scientific Areas
            self.stdout.write('Creating Scientific Areas...')
            areas = []
            area_names = [
                "Engenharia Informática",
                "Engenharia de Sistemas",
                "Ciências da Computação",
            ]
            
            for area_name in area_names:
                area, created = ScientificArea.objects.get_or_create(area_name=area_name)
                areas.append(area)
                if created:
                    self.stdout.write(f'  Created: {area_name}')

            # Create Teachers
            self.stdout.write('Creating Teachers...')
            teachers = []
            teacher_data = [
                {
                    "email": "professor1@isec.pt",
                    "name": "João Silva",
                    "category": "Professor Auxiliar",
                    "area": areas[0],
                },
                {
                    "email": "professor2@isec.pt",
                    "name": "Maria Santos",
                    "category": "Professor Coordenador",
                    "area": areas[0],
                },
                {
                    "email": "professor3@isec.pt",
                    "name": "Carlos Oliveira",
                    "category": "Professor Auxiliar",
                    "area": areas[1],
                },
            ]

            modules = Module.objects.all()
            
            for t_data in teacher_data:
                if not Accounts.objects.filter(email=t_data["email"]).exists():
                    user = Accounts.objects.create(
                        username=t_data["email"],
                        email=t_data["email"],
                        user_type='teacher',
                    )
                    user.set_password(settings.teacher_password)
                    user.save()

                    teacher = Teacher.objects.create(
                        user=user,
                        teacher_name=t_data["name"],
                        teacher_category=t_data["category"],
                        active=True,
                        scientific_area=t_data["area"]
                    )

                    # Create permissions for teacher (view for all modules)
                    for module in modules:
                        Permissions.objects.create(
                            teacher=teacher,
                            module=module,
                            can_view=True,
                            can_edit=False,
                            can_delete=False
                        )

                    teachers.append(teacher)
                    self.stdout.write(f'  Created: {t_data["name"]}')

            # Create Courses
            self.stdout.write('Creating Courses...')
            courses = []
            course_data = [
                {
                    "name": "Licenciatura em Engenharia Informática",
                    "description": "Curso de licenciatura em Engenharia Informática",
                    "website": "https://www.isec.pt/lei",
                    "email": "lei@isec.pt",
                    "area": areas[0],
                    "branches": [
                        {"name": "Desenvolvimento de Software", "acronym": "DS", "color": "#007bff"},
                        {"name": "Sistemas e Redes", "acronym": "SR", "color": "#28a745"},
                    ],
                },
                {
                    "name": "Mestrado em Engenharia Informática",
                    "description": "Curso de mestrado em Engenharia Informática",
                    "website": "https://www.isec.pt/mei",
                    "email": "mei@isec.pt",
                    "area": areas[0],
                    "branches": [
                        {"name": "Tecnologias Web", "acronym": "TW", "color": "#dc3545"},
                    ],
                },
            ]

            for c_data in course_data:
                if not Course.objects.filter(course_name=c_data["name"]).exists():
                    course = Course.objects.create(
                        course_name=c_data["name"],
                        course_description=c_data["description"],
                        course_website=c_data["website"],
                        technologies_active=True,
                        methodologies_active=True,
                        objectives_active=True,
                        scientific_area=c_data["area"],
                        commission_email=c_data["email"],
                    )

                    # Add first teacher as responsible and commission member
                    # Note: add_admin automatically sets as responsible if no responsible exists
                    if teachers:
                        course.add_admin(teachers[0].id_teacher)

                    # Add branches
                    for branch_data in c_data["branches"]:
                        course.add_branch(
                            name=branch_data["name"],
                            acronym=branch_data["acronym"],
                            color=branch_data["color"]
                        )

                    courses.append(course)
                    self.stdout.write(f'  Created: {c_data["name"]}')

            # Create Students
            self.stdout.write('Creating Students...')
            student_data = [
                {
                    "number": 12345,
                    "email": "aluno1@isec.pt",
                    "name": "Pedro Costa",
                    "nationality": "Português",
                    "ident_type": "BI",
                    "ident_doc": 12345678,
                    "nif": 123456789,
                    "gender": "Masculino",
                    "address": "Rua Exemplo, 123",
                    "contact": "912345678",
                    "current_year": 3,
                    "average": 15.5,
                    "subjects_done": 18,
                    "ects": 180,
                    "course": courses[0] if courses else None,
                    "branch": None,
                },
                {
                    "number": 12346,
                    "email": "aluno2@isec.pt",
                    "name": "Ana Ferreira",
                    "nationality": "Português",
                    "ident_type": "CC",
                    "ident_doc": 87654321,
                    "nif": 987654321,
                    "gender": "Feminino",
                    "address": "Avenida Teste, 456",
                    "contact": "923456789",
                    "current_year": 2,
                    "average": 16.0,
                    "subjects_done": 12,
                    "ects": 120,
                    "course": courses[0] if courses else None,
                    "branch": None,
                },
            ]

            for s_data in student_data:
                if not Accounts.objects.filter(email=s_data["email"]).exists() and s_data["course"]:
                    user = Accounts.objects.create(
                        username=s_data["email"],
                        email=s_data["email"],
                        user_type='student',
                    )
                    user.set_password(settings.student_password)
                    user.save()

                    student = Student.objects.create(
                        user=user,
                        student_number=s_data["number"],
                        student_name=s_data["name"],
                        nationality=s_data["nationality"],
                        ident_type=s_data["ident_type"],
                        ident_doc=s_data["ident_doc"],
                        nif=s_data["nif"],
                        gender=s_data["gender"],
                        address=s_data["address"],
                        contact=s_data["contact"],
                        current_year=s_data["current_year"],
                        average=s_data["average"],
                        subjects_done=s_data["subjects_done"],
                        student_course=s_data["course"],
                        student_branch=s_data["branch"],
                        student_ects=s_data["ects"],
                        active=True,
                    )
                    self.stdout.write(f'  Created: {s_data["name"]}')

            # Create Companies
            self.stdout.write('Creating Companies...')
            company_data = [
                {
                    "name": "Tech Solutions Lda",
                    "email": "contacto@techsolutions.pt",
                    "address": "Rua das Empresas, 100",
                    "postal_code": "3000-000",
                    "nipc": 123456789,
                    "contact": "234567890",
                    "website": "https://www.techsolutions.pt",
                    "linkedin": "https://linkedin.com/company/techsolutions",
                    "representative": {
                        "email": "representante1@techsolutions.pt",
                        "name": "Luís Mendes",
                        "role": "Diretor de Recursos Humanos",
                        "contact": "912345678",
                    },
                },
                {
                    "name": "Innovate Systems",
                    "email": "info@innovatesystems.pt",
                    "address": "Avenida da Inovação, 200",
                    "postal_code": "3000-001",
                    "nipc": 987654321,
                    "contact": "234567891",
                    "website": "https://www.innovatesystems.pt",
                    "linkedin": "https://linkedin.com/company/innovatesystems",
                    "representative": {
                        "email": "representante2@innovatesystems.pt",
                        "name": "Sofia Rodrigues",
                        "role": "CEO",
                        "contact": "923456789",
                    },
                },
            ]

            for c_data in company_data:
                if not Company.objects.filter(company_email=c_data["email"]).exists():
                    company = Company.objects.create(
                        company_name=c_data["name"],
                        company_email=c_data["email"],
                        company_address=c_data["address"],
                        company_postal_code=c_data["postal_code"],
                        company_nipc=c_data["nipc"],
                        company_contact=c_data["contact"],
                        company_website=c_data["website"],
                        company_linkedin=c_data["linkedin"],
                        active=True,
                    )

                    # Create representative
                    rep_data = c_data["representative"]
                    if not Accounts.objects.filter(email=rep_data["email"]).exists():
                        user = Accounts.objects.create(
                            username=rep_data["email"],
                            email=rep_data["email"],
                            user_type='representative'
                        )
                        user.set_password(settings.representative_password)
                        user.save()

                        representative = Representative.objects.create(
                            user=user,
                            representative_name=rep_data["name"],
                            representative_role=rep_data["role"],
                            representative_contact=rep_data["contact"],
                            company=company,
                            active=True,
                        )

                        company.company_admin = representative
                        company.save()

                    self.stdout.write(f'  Created: {c_data["name"]}')

            # Create test data if requested
            if options.get('with_test_data'):
                self.stdout.write(self.style.SUCCESS('\n=== Creating test data (calendars, proposals, candidatures) ==='))
                self._create_test_data(courses)

        self.stdout.write(self.style.SUCCESS('\n=== Database seeding completed successfully! ==='))
        self.stdout.write(self.style.SUCCESS(f'  Scientific Areas: {ScientificArea.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Courses: {Course.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Teachers: {Teacher.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Students: {Student.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Companies: {Company.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Representatives: {Representative.objects.count()}'))
        if options.get('with_test_data'):
            self.stdout.write(self.style.SUCCESS(f'  Calendars: {Calendar.objects.count()}'))
            self.stdout.write(self.style.SUCCESS(f'  Proposals: {Proposal.objects.count()}'))
            self.stdout.write(self.style.SUCCESS(f'  Candidatures: {Candidature.objects.count()}'))

    def _create_test_data(self, courses):
        """Create test calendars, proposals, and candidatures"""
        
        # 1. Create or activate calendar
        self.stdout.write('Creating/activating calendar...')
        course = courses[0] if courses else Course.objects.first()
        
        if not course:
            self.stdout.write(self.style.WARNING('  No course found, skipping test data'))
            return
        
        calendar = Calendar.objects.first()
        if not calendar:
            today = date.today()
            calendar = Calendar.objects.create(
                calendar_year=today.year,
                calendar_semester=1 if today.month <= 6 else 2,
                submission_start=today - timedelta(days=10),
                submission_end=today + timedelta(days=30),
                divulgation=today + timedelta(days=40),
                candidatures=today + timedelta(days=50),
                candidatures=today + timedelta(days=50),
                registrations=today + timedelta(days=60),
                placements=today + timedelta(days=60),
                course=course
            )
            self.stdout.write(f'  Created: {calendar.calendar_year}/{calendar.calendar_year+1} - {calendar.calendar_semester}º Sem')
        else:
            # Activate existing calendar
            today = date.today()
            calendar.submission_start = today - timedelta(days=10)
            calendar.submission_end = today + timedelta(days=30)
            calendar.divulgation = today + timedelta(days=40)
            calendar.candidatures = today + timedelta(days=50)
            calendar.registrations = today + timedelta(days=60)
            calendar.placements = today + timedelta(days=60)
            calendar.save()
            self.stdout.write(f'  Activated: {calendar}')
        
        # 2. Create test company and representative
        self.stdout.write('Creating test company...')
        company_email = "empresa.teste@example.com"
        rep_email = "rep.teste@example.com"
        
        company = Company.objects.filter(company_email=company_email).first()
        if not company:
            # Check if representative account already exists
            rep_account = Accounts.objects.filter(email=rep_email).first()
            if not rep_account:
                rep_account = Accounts.objects.create(
                    username=rep_email,
                    email=rep_email,
                    user_type="representative"
                )
                rep_account.set_password("rep@123")
                rep_account.save()
            
            company = Company.objects.create(
                company_name="Empresa de Testes Lda",
                company_email=company_email,
                company_address="Rua de Testes, 123",
                company_postal_code="3000-000",
                company_nipc=999888777,
                company_contact="912345678",
                company_website="https://empresa-testes.pt",
                company_linkedin="empresa-testes"
            )
            
            representative = Representative.objects.create(
                user=rep_account,
                representative_name="João Representante",
                representative_role="Director de RH",
                representative_contact="912345679",
                company=company
            )
            
            company.company_admin = representative
            company.save()
            self.stdout.write(f'  Created: {company.company_name}')
        else:
            representative = company.representatives.first()
            self.stdout.write(f'  Using existing: {company.company_name}')
        
        # 3. Create test proposal
        self.stdout.write('Creating test proposal...')
        proposal_title = "Estágio de Testes em Desenvolvimento Web"
        proposal = Proposal.objects.filter(proposal_title=proposal_title).first()
        
        if not proposal:
            proposal = Proposal.objects.create(
                proposal_title=proposal_title,
                proposal_description="Desenvolvimento de aplicações web usando React e Django",
                proposal_technologies="React, Django, PostgreSQL",
                proposal_methodologies="Agile, Scrum",
                proposal_scheduling="40 horas semanais durante 6 meses",
                proposal_selection_method="Entrevista técnica e avaliação de currículo",
                proposal_conditions="Bolsa de estágio, subsídio de alimentação",
                proposal_type=1,  # Estágio
                course=course,
                calendar=calendar,
                work_format="1",  # On-site
                location="Coimbra",
                schedule="9h-18h",
                slots=3,
                proposal_objectives="Desenvolver competências em desenvolvimento full-stack",
                company=company,
                company_advisor=representative,
                proposal_submission_date=datetime.now().date()
            )
            self.stdout.write(f'  Created: {proposal.proposal_title}')
        else:
            self.stdout.write(f'  Using existing: {proposal.proposal_title}')
        
        # 4. Create test students and candidatures
        self.stdout.write('Creating test students with candidatures...')
        test_students = [
            {
                "email": "teste.aluno1@isec.pt",
                "number": 2020111111,
                "name": "Maria Teste Candidata",
                "state": "pending"
            },
            {
                "email": "teste.aluno2@isec.pt",
                "number": 2021222222,
                "name": "João Teste Candidato",
                "state": "pending"
            },
        ]
        
        for s_data in test_students:
            student_account = Accounts.objects.filter(email=s_data["email"]).first()
            if not student_account:
                student_account = Accounts.objects.create(
                    username=s_data["email"],
                    email=s_data["email"],
                    user_type="student"
                )
                student_account.set_password("aluno@123")
                student_account.save()
            
            student = Student.objects.filter(user=student_account).first()
            if not student:
                student = Student.objects.create(
                    user=student_account,
                    student_number=s_data["number"],
                    student_name=s_data["name"],
                    nationality="Portuguesa",
                    address="Rua dos Testes, 10",
                    contact="912000000",
                    current_year=3,
                    student_course=course,
                    student_ects=150
                )
            
            # Create candidature
            candidature = Candidature.objects.filter(student=student).first()
            if not candidature:
                candidature = Candidature.objects.create(
                    student=student,
                    state=s_data["state"],
                    candidature_submission_date=datetime.now().date()
                )
            
            # Link to proposal
            if not CandidatureProposal.objects.filter(candidature=candidature, proposal=proposal).exists():
                CandidatureProposal.objects.create(
                    candidature=candidature,
                    proposal=proposal,
                    state=s_data["state"]
                )
            
            self.stdout.write(f'  Created: {student.student_name} ({s_data["state"]})')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Test data created successfully!'))

