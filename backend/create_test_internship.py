import os
import django
import sys
from datetime import datetime, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestor_estagios.settings')
django.setup()

from api.models import (
    Accounts, Company, Representative, Course, 
    Calendar, Proposal, Student, Candidature, CandidatureProposal
)
from django.db import transaction

def create_test_data():
    print("Creating test data for internships...")
    
    try:
        with transaction.atomic():
            # 1. Get or create a course
            course = Course.objects.first()
            if not course:
                print("❌ No course found. Please create a course first.")
                return
            print(f"✓ Using course: {course.course_name}")
            
            # 2. Get active calendar
            calendar = Calendar.objects.filter(
                submission_start__lte=datetime.now(),
                submission_end__gte=datetime.now()
            ).first()
            
            if not calendar:
                print("❌ No active calendar found. Run activate_calendar.py first.")
                return
            print(f"✓ Using calendar: {calendar.calendar_year}/{calendar.calendar_year+1} - {calendar.calendar_semester}º Sem")
            
            # 3. Create company and representative
            company_email = "empresa.teste@example.com"
            rep_email = "representante.teste@example.com"
            
            company = Company.objects.filter(company_email=company_email).first()
            
            if not company:
                # Create representative account
                rep_account = Accounts.objects.create(
                    username=rep_email,
                    email=rep_email,
                    user_type="representative"
                )
                rep_account.set_password("rep123")
                rep_account.save()
                print(f"✓ Created representative account: {rep_email}")
                
                # Create company
                company = Company.objects.create(
                    company_name="Empresa de Testes Lda",
                    company_email=company_email,
                    company_address="Rua de Testes, 123",
                    company_postal_code="3000-000",
                    company_nipc=123456789,
                    company_contact="912345678",
                    company_website="https://empresa-testes.pt",
                    company_linkedin="empresa-testes"
                )
                print(f"✓ Created company: {company.company_name}")
                
                # Create representative
                representative = Representative.objects.create(
                    user=rep_account,
                    representative_name="João Representante",
                    representative_role="Director de RH",
                    representative_contact="912345679",
                    company=company
                )
                print(f"✓ Created representative: {representative.representative_name}")
                
                # Set company admin
                company.company_admin = representative
                company.save()
                print(f"✓ Set company admin")
            else:
                print(f"✓ Using existing company: {company.company_name}")
                representative = company.representatives.first()
                if not representative:
                    print("❌ Company exists but has no representatives!")
                    return
                print(f"✓ Using existing representative: {representative.representative_name}")
            
            # 4. Create proposal (internship type)
            proposal = Proposal.objects.filter(
                proposal_title="Estágio de Testes em Desenvolvimento Web"
            ).first()
            
            if not proposal:
                proposal = Proposal.objects.create(
                    proposal_title="Estágio de Testes em Desenvolvimento Web",
                    proposal_description="Desenvolvimento de aplicações web usando React e Django",
                    proposal_technologies="React, Django, PostgreSQL",
                    proposal_methodologies="Agile, Scrum",
                    proposal_scheduling="40 horas semanais durante 6 meses",
                    proposal_selection_method="Entrevista técnica e avaliação de currículo",
                    proposal_conditions="Bolsa de estágio, subsídio de alimentação",
                    proposal_type=1,  # 1 = Estágio
                    course=course,
                    calendar=calendar,
                    work_format="1",  # 1 = On-site
                    location="Coimbra",
                    schedule="9h-18h",
                    slots=2,
                    proposal_objectives="Desenvolver competências em desenvolvimento full-stack",
                    company=company,
                    company_advisor=representative,
                    proposal_submission_date=datetime.now().date()
                )
                print(f"✓ Created proposal: {proposal.proposal_title}")
            else:
                print(f"✓ Using existing proposal: {proposal.proposal_title}")
            
            # 4. Get or create student 1
            student_email = "aluno.teste@isec.pt"
            student_account = Accounts.objects.filter(email=student_email).first()
            
            if not student_account:
                student_account = Accounts.objects.create(
                    username=student_email,
                    email=student_email,
                    user_type="student"
                )
                student_account.set_password("aluno123")
                student_account.save()
                print(f"✓ Created student account: {student_email}")
            else:
                print(f"✓ Using existing student account: {student_email}")
            
            student = Student.objects.filter(user=student_account).first()
            if not student:
                student = Student.objects.create(
                    user=student_account,
                    student_number=2020123456,
                    student_name="Maria Aluna Testes",
                    nationality="Portuguesa",
                    address="Rua dos Estudantes, 10",
                    contact="912345680",
                    current_year=3,
                    student_course=course,
                    student_ects=150
                )
                print(f"✓ Created student: {student.student_name}")
            else:
                print(f"✓ Using existing student: {student.student_name}")
            
            # Create second student
            student2_email = "aluno2.teste@isec.pt"
            student2_account = Accounts.objects.filter(email=student2_email).first()
            
            if not student2_account:
                student2_account = Accounts.objects.create(
                    username=student2_email,
                    email=student2_email,
                    user_type="student"
                )
                student2_account.set_password("aluno123")
                student2_account.save()
                print(f"✓ Created student account: {student2_email}")
            else:
                print(f"✓ Using existing student account: {student2_email}")
            
            student2 = Student.objects.filter(user=student2_account).first()
            if not student2:
                student2 = Student.objects.create(
                    user=student2_account,
                    student_number=2021987654,
                    student_name="João Silva Testes",
                    nationality="Portuguesa",
                    address="Avenida Central, 25",
                    contact="923456789",
                    current_year=4,
                    student_course=course,
                    student_ects=180
                )
                print(f"✓ Created student: {student2.student_name}")
            else:
                print(f"✓ Using existing student: {student2.student_name}")
            
            # 5. Create candidature for student 1
            candidature = Candidature.objects.filter(
                student=student
            ).first()
            
            if not candidature:
                candidature = Candidature.objects.create(
                    student=student,
                    state="placed",  # Estado que conta como internship ativa
                    candidature_submission_date=datetime.now().date()
                )
                print(f"✓ Created candidature with state 'placed' for {student.student_name}")
            else:
                candidature.state = "placed"
                candidature.save()
                print(f"✓ Updated candidature state to 'placed' for {student.student_name}")
            
            # 6. Link candidature to proposal for student 1
            candidature_proposal = CandidatureProposal.objects.filter(
                candidature=candidature,
                proposal=proposal
            ).first()
            
            if not candidature_proposal:
                CandidatureProposal.objects.create(
                    candidature=candidature,
                    proposal=proposal,
                    state='accepted'
                )
                print(f"✓ Linked candidature to proposal for {student.student_name}")
            else:
                print(f"✓ Candidature already linked to proposal for {student.student_name}")
            
            # 7. Create candidature for student 2
            candidature2 = Candidature.objects.filter(
                student=student2
            ).first()
            
            if not candidature2:
                candidature2 = Candidature.objects.create(
                    student=student2,
                    state="protocol_generated",  # Diferente estado
                    candidature_submission_date=datetime.now().date()
                )
                print(f"✓ Created candidature with state 'protocol_generated' for {student2.student_name}")
            else:
                candidature2.state = "protocol_generated"
                candidature2.save()
                print(f"✓ Updated candidature state to 'protocol_generated' for {student2.student_name}")
            
            # 8. Link candidature to proposal for student 2
            candidature_proposal2 = CandidatureProposal.objects.filter(
                candidature=candidature2,
                proposal=proposal
            ).first()
            
            if not candidature_proposal2:
                CandidatureProposal.objects.create(
                    candidature=candidature2,
                    proposal=proposal,
                    state='accepted'
                )
                print(f"✓ Linked candidature to proposal for {student2.student_name}")
            else:
                print(f"✓ Candidature already linked to proposal for {student2.student_name}")
            
            print("\n" + "="*60)
            print("✅ TEST DATA CREATED SUCCESSFULLY!")
            print("="*60)
            print("\nTest accounts created:")
            print(f"  Representative: {rep_email} / rep123")
            print(f"  Student 1: {student_email} / aluno123")
            print(f"  Student 2: {student2_email} / aluno123")
            print(f"\nBoth students have active internships!")
            print(f"  - {student.student_name}: state 'placed'")
            print(f"  - {student2.student_name}: state 'protocol_generated'")
            print(f"\nYou can now test the endpoint: /api/students/internships/")
            
    except Exception as e:
        print(f"\n❌ Error creating test data: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_data()
