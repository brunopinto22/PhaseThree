from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import (
    Accounts, ScientificArea, Course, Branch, Teacher, Student,
    Company, Representative, Settings, Module, Permissions,
    Calendar, Proposal
)


class Command(BaseCommand):
    help = 'Seeds the database with sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Proposal.objects.all().delete()
            Calendar.objects.all().delete()
            Student.objects.all().delete()
            Representative.objects.all().delete()
            Company.objects.all().delete()
            Teacher.objects.all().delete()
            Course.objects.all().delete()
            ScientificArea.objects.all().delete()
            # Delete non-admin accounts
            Accounts.objects.exclude(user_type='admin').delete()
            self.stdout.write(self.style.WARNING('Cleared all non-admin accounts'))

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
                    "email": "docente1@isec.pt",
                    "name": "João Silva",
                    "category": "Professor Auxiliar",
                    "area": areas[0],
                },
                {
                    "email": "docente2@isec.pt",
                    "name": "Maria Santos",
                    "category": "Professor Coordenador",
                    "area": areas[0],
                },
                {
                    "email": "docente3@isec.pt",
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
                else:
                    teacher = Teacher.objects.filter(user__email=t_data["email"]).first()
                    if teacher:
                        teachers.append(teacher)

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
                course, created = Course.objects.get_or_create(
                    course_name=c_data["name"],
                    defaults={
                        "course_description": c_data["description"],
                        "course_website": c_data["website"],
                        "technologies_active": True,
                        "methodologies_active": True,
                        "objectives_active": True,
                        "scientific_area": c_data["area"],
                        "commission_email": c_data["email"],
                    }
                )

                if created:
                    # Add first teacher as responsible and commission member
                    if teachers:
                        course.add_admin(teachers[0].id_teacher)

                    # Add branches
                    for branch_data in c_data["branches"]:
                        if not course.branches.filter(branch_name=branch_data["name"]).exists():
                            course.add_branch(
                                name=branch_data["name"],
                                acronym=branch_data["acronym"],
                                color=branch_data["color"]
                            )

                    self.stdout.write(f'  Created: {c_data["name"]}')

                courses.append(course)

            # Create Calendar for current period
            self.stdout.write('Creating Calendars...')
            today = date.today()
            calendars = []
            
            for course in courses:
                calendar, created = Calendar.objects.get_or_create(
                    course=course,
                    calendar_year=today.year,
                    calendar_semester=1 if today.month < 7 else 2,
                    defaults={
                        "submission_start": today - timedelta(days=30),
                        "submission_end": today - timedelta(days=1),
                        "divulgation": today - timedelta(days=1),
                        "registrations": today + timedelta(days=30),
                        "candidatures": today + timedelta(days=14),
                        "placements": today + timedelta(days=21),
                        "min_proposals": 1,
                        "max_proposals": 3,
                    }
                )
                
                if created:
                    self.stdout.write(f'  Created calendar for: {course.course_name}')
                
                calendars.append(calendar)

            # Create Companies
            self.stdout.write('Creating Companies...')
            companies = []
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

            representatives = []
            for c_data in company_data:
                company, created = Company.objects.get_or_create(
                    company_email=c_data["email"],
                    defaults={
                        "company_name": c_data["name"],
                        "company_address": c_data["address"],
                        "company_postal_code": c_data["postal_code"],
                        "company_nipc": c_data["nipc"],
                        "company_contact": c_data["contact"],
                        "company_website": c_data["website"],
                        "company_linkedin": c_data["linkedin"],
                        "active": True,
                    }
                )

                if created:
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
                        representatives.append(representative)

                    self.stdout.write(f'  Created: {c_data["name"]}')
                
                companies.append(company)

            # Create Proposals for each calendar
            self.stdout.write('Creating Proposals...')
            proposal_data = [
                {
                    "title": "Desenvolvimento de Aplicação Web",
                    "description": "Desenvolvimento de uma aplicação web moderna usando React e Django.",
                    "selection": "Entrevista técnica e análise de CV",
                    "conditions": "Conhecimentos de JavaScript e Python",
                    "scheduling": "Horário flexível",
                    "technologies": "React, Django, PostgreSQL",
                    "methodologies": "Agile, Scrum",
                    "objectives": "Desenvolver uma aplicação completa",
                    "type": 1,
                    "format": 3,
                    "location": "Coimbra",
                    "schedule": "9h-18h",
                    "slots": 2,
                },
                {
                    "title": "Desenvolvimento de App Mobile",
                    "description": "Criação de aplicação mobile multiplataforma.",
                    "selection": "Teste prático e entrevista",
                    "conditions": "Experiência com React Native ou Flutter",
                    "scheduling": "Full-time",
                    "technologies": "React Native, Firebase",
                    "methodologies": "Kanban",
                    "objectives": "Lançar app nas lojas",
                    "type": 1,
                    "format": 2,
                    "location": "Remoto",
                    "schedule": "Flexível",
                    "slots": 1,
                },
                {
                    "title": "Análise de Dados e Machine Learning",
                    "description": "Projeto de análise de dados com modelos de ML.",
                    "selection": "Análise de portfolio",
                    "conditions": "Python, conhecimentos de ML",
                    "scheduling": "Part-time possível",
                    "technologies": "Python, TensorFlow, Pandas",
                    "methodologies": "CRISP-DM",
                    "objectives": "Implementar modelos preditivos",
                    "type": 1,
                    "format": 3,
                    "location": "Coimbra/Remoto",
                    "schedule": "Flexível",
                    "slots": 2,
                },
                {
                    "title": "DevOps e Infraestrutura Cloud",
                    "description": "Gestão de infraestrutura cloud e pipelines CI/CD.",
                    "selection": "Entrevista técnica",
                    "conditions": "Conhecimentos de Docker, Kubernetes",
                    "scheduling": "Full-time",
                    "technologies": "AWS, Docker, Kubernetes, Terraform",
                    "methodologies": "DevOps, GitOps",
                    "objectives": "Automatizar deployments",
                    "type": 1,
                    "format": 1,
                    "location": "Lisboa",
                    "schedule": "9h-18h",
                    "slots": 1,
                },
            ]

            for calendar in calendars:
                for idx, p_data in enumerate(proposal_data):
                    company = companies[idx % len(companies)]
                    rep = company.company_admin
                    
                    if not Proposal.objects.filter(
                        calendar=calendar,
                        proposal_title=p_data["title"]
                    ).exists():
                        proposal = Proposal.objects.create(
                            proposal_title=p_data["title"],
                            proposal_description=p_data["description"],
                            proposal_selection_method=p_data["selection"],
                            proposal_conditions=p_data["conditions"],
                            proposal_scheduling=p_data["scheduling"],
                            proposal_technologies=p_data["technologies"],
                            proposal_methodologies=p_data["methodologies"],
                            proposal_objectives=p_data["objectives"],
                            proposal_type=p_data["type"],
                            course=calendar.course,
                            work_format=p_data["format"],
                            location=p_data["location"],
                            schedule=p_data["schedule"],
                            slots=p_data["slots"],
                            calendar=calendar,
                            proposal_submission_date=today,
                            company=company,
                            company_advisor=rep,
                        )
                        self.stdout.write(f'  Created proposal: {p_data["title"]} for {calendar}')

            # Create Students with calendar assigned
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

                    # Find calendar for student's course
                    student_calendar = Calendar.objects.filter(course=s_data["course"]).first()

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
                        calendar=student_calendar,
                        active=True,
                    )
                    self.stdout.write(f'  Created: {s_data["name"]} (calendar: {student_calendar})')

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
        self.stdout.write(self.style.SUCCESS(f'  Scientific Areas: {ScientificArea.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Courses: {Course.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Calendars: {Calendar.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Teachers: {Teacher.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Students: {Student.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Companies: {Company.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Representatives: {Representative.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'  Proposals: {Proposal.objects.count()}'))
