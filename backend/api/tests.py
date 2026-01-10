from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.models import (
    Student, Teacher, Course, Calendar, Proposal, Company,
    Representative, Candidature, CandidatureProposal, Protocol, Consent
)
from api.token_manager import generate_token
from datetime import date, timedelta
import json


class AuthenticationTests(TestCase):
    """REQ-18: Test authentication and token management"""
    
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()
        self.admin_user = self.User.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            password='admin123',
            user_type='admin'
        )
    
    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/user/login', {
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', response.json())
    
    def test_login_failure(self):
        """Test login with wrong credentials"""
        response = self.client.post('/api/user/login', {
            'email': 'admin@test.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 401)
    
    def test_token_validation(self):
        """Test token validation"""
        token = generate_token(self.admin_user.pk, self.admin_user.email, 'admin')
        response = self.client.get('/api/user/summary', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)


class CandidatureTests(TestCase):
    """REQ-18: Test candidature submission and state transitions"""
    
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()
        
        # Create course and calendar
        self.course = Course.objects.create(
            course_name='Test Course',
            course_degree='Bachelor'
        )
        self.calendar = Calendar.objects.create(
            calendar_year=2025,
            calendar_semester=2,
            submission_start=date.today() - timedelta(days=10),
            submission_end=date.today() + timedelta(days=10),
            divulgation=date.today() + timedelta(days=15),
            candidatures=date.today() + timedelta(days=20),
            placements=date.today() + timedelta(days=30),
            min_proposals=1,
            max_proposals=3,
            course=self.course
        )
        
        # Create student
        self.student_user = self.User.objects.create_user(
            username='student@test.com',
            email='student@test.com',
            password='student123',
            user_type='student'
        )
        self.student = Student.objects.create(
            user=self.student_user,
            student_number=12345,
            student_name='Test Student',
            nationality='PT',
            nif=123456789,
            address='Test Address',
            contact='912345678',
            average=15.5,
            student_course=self.course,
            calendar=self.calendar
        )
        
        # Create company and proposal
        self.company = Company.objects.create(
            company_name='Test Company',
            company_nif=987654321
        )
        self.proposal = Proposal.objects.create(
            proposal_title='Test Proposal',
            proposal_description='Test Description',
            company=self.company,
            course=self.course,
            slots=2,
            calendar=self.calendar
        )
        
        self.token = generate_token(self.student_user.pk, self.student_user.email, 'student')
    
    def test_candidature_submission(self):
        """Test student submitting candidature"""
        response = self.client.post('/api/candidature', {
            'proposals': [self.proposal.id_proposal]
        }, HTTP_AUTHORIZATION=f'Bearer {self.token}')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Candidature.objects.count(), 1)
        candidature = Candidature.objects.first()
        self.assertEqual(candidature.state, 'submitted')
    
    def test_candidature_state_transition(self):
        """Test candidature state changes"""
        candidature = Candidature.objects.create(
            student=self.student,
            state='submitted',
            candidature_submission_date=date.today()
        )
        CandidatureProposal.objects.create(
            candidature=candidature,
            proposal=self.proposal
        )
        
        # Test transition to placed
        candidature.state = 'placed'
        candidature.save()
        self.assertEqual(candidature.state, 'placed')


class PlacementAlgorithmTests(TestCase):
    """REQ-18: Test automatic placement algorithm"""
    
    def setUp(self):
        self.User = get_user_model()
        
        # Create course and calendar
        self.course = Course.objects.create(
            course_name='Test Course',
            course_degree='Bachelor'
        )
        self.calendar = Calendar.objects.create(
            calendar_year=2025,
            calendar_semester=2,
            submission_start=date.today() - timedelta(days=10),
            submission_end=date.today() + timedelta(days=10),
            divulgation=date.today() + timedelta(days=15),
            candidatures=date.today() + timedelta(days=20),
            placements=date.today(),
            min_proposals=1,
            max_proposals=3,
            course=self.course
        )
        
        # Create proposal with 1 slot
        self.company = Company.objects.create(
            company_name='Test Company',
            company_nif=987654321
        )
        self.proposal = Proposal.objects.create(
            proposal_title='Test Proposal',
            proposal_description='Test Description',
            company=self.company,
            course=self.course,
            slots=1,
            calendar=self.calendar
        )
        
        # Create 2 students with different averages
        self.student1_user = self.User.objects.create_user(
            username='student1@test.com',
            email='student1@test.com',
            password='student123',
            user_type='student'
        )
        self.student1 = Student.objects.create(
            user=self.student1_user,
            student_number=11111,
            student_name='Student One',
            nationality='PT',
            nif=111111111,
            average=16.0,  # Higher average
            student_course=self.course,
            calendar=self.calendar
        )
        
        self.student2_user = self.User.objects.create_user(
            username='student2@test.com',
            email='student2@test.com',
            password='student123',
            user_type='student'
        )
        self.student2 = Student.objects.create(
            user=self.student2_user,
            student_number=22222,
            student_name='Student Two',
            nationality='PT',
            nif=222222222,
            average=14.0,  # Lower average
            student_course=self.course,
            calendar=self.calendar
        )
        
        # Create candidatures
        self.cand1 = Candidature.objects.create(
            student=self.student1,
            state='submitted',
            candidature_submission_date=date.today()
        )
        CandidatureProposal.objects.create(
            candidature=self.cand1,
            proposal=self.proposal
        )
        
        self.cand2 = Candidature.objects.create(
            student=self.student2,
            state='submitted',
            candidature_submission_date=date.today()
        )
        CandidatureProposal.objects.create(
            candidature=self.cand2,
            proposal=self.proposal
        )
    
    def test_placement_by_average(self):
        """Test that student with higher average gets placed first"""
        from api.tasks.placements import handle_placements
        
        result = handle_placements(self.calendar.id_calendar)
        
        self.cand1.refresh_from_db()
        self.cand2.refresh_from_db()
        
        # Student 1 (higher average) should be placed
        self.assertEqual(self.cand1.state, 'placed')
        # Student 2 should not be placed (no more slots)
        self.assertEqual(self.cand2.state, 'revision')


class ProtocolGenerationTests(TestCase):
    """REQ-18: Test protocol generation"""
    
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()
        
        # Create admin user
        self.admin_user = self.User.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            password='admin123',
            user_type='admin'
        )
        
        # Create necessary objects
        self.course = Course.objects.create(
            course_name='Test Course',
            course_degree='Bachelor'
        )
        self.calendar = Calendar.objects.create(
            calendar_year=2025,
            calendar_semester=2,
            submission_start=date.today(),
            submission_end=date.today() + timedelta(days=10),
            divulgation=date.today() + timedelta(days=15),
            candidatures=date.today() + timedelta(days=20),
            placements=date.today() + timedelta(days=30),
            min_proposals=1,
            max_proposals=3,
            course=self.course
        )
        
        self.student_user = self.User.objects.create_user(
            username='student@test.com',
            email='student@test.com',
            password='student123',
            user_type='student'
        )
        self.student = Student.objects.create(
            user=self.student_user,
            student_number=12345,
            student_name='Test Student',
            nationality='PT',
            nif=123456789,
            average=15.5,
            student_course=self.course,
            calendar=self.calendar
        )
        
        self.company = Company.objects.create(
            company_name='Test Company',
            company_nif=987654321
        )
        self.proposal = Proposal.objects.create(
            proposal_title='Test Proposal',
            company=self.company,
            course=self.course,
            slots=1,
            calendar=self.calendar,
            location='Test Location'
        )
        
        # Create placed candidature
        self.candidature = Candidature.objects.create(
            student=self.student,
            state='placed',
            candidature_submission_date=date.today()
        )
        CandidatureProposal.objects.create(
            candidature=self.candidature,
            proposal=self.proposal,
            state='accepted'
        )
        
        self.token = generate_token(self.admin_user.pk, self.admin_user.email, 'admin')
    
    def test_protocol_generation(self):
        """Test generating protocol for placed candidature"""
        response = self.client.post(
            f'/api/protocol/{self.candidature.id_candidature}/generate',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Protocol.objects.count(), 1)
        protocol = Protocol.objects.first()
        self.assertIsNotNone(protocol.protocol_number)
        self.assertTrue(protocol.isec_signed_at is not None)  # Auto-signed by ISEC


class GDPRComplianceTests(TestCase):
    """REQ-18: Test GDPR compliance features"""
    
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()
        
        self.user = self.User.objects.create_user(
            username='test@test.com',
            email='test@test.com',
            password='test123',
            user_type='student'
        )
        
        # Create consent
        Consent.objects.create(
            user=self.user,
            consent_given=True,
            consent_ip='127.0.0.1'
        )
        
        self.token = generate_token(self.user.pk, self.user.email, 'student')
    
    def test_data_export(self):
        """Test GDPR data export"""
        response = self.client.get(
            '/api/user/gdpr/export',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('account', data)
        self.assertIn('gdpr_consent', data)
        self.assertEqual(data['account']['email'], 'test@test.com')
    
    def test_data_deletion(self):
        """Test GDPR data deletion/anonymization"""
        response = self.client.post(
            '/api/user/gdpr/delete',
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
        
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertIn('deleted_', self.user.email)
        self.assertFalse(self.user.is_active)


class PermissionTests(TestCase):
    """REQ-18: Test role-based access control"""
    
    def setUp(self):
        self.client = APIClient()
        self.User = get_user_model()
        
        self.student_user = self.User.objects.create_user(
            username='student@test.com',
            email='student@test.com',
            password='student123',
            user_type='student'
        )
        self.student_token = generate_token(self.student_user.pk, self.student_user.email, 'student')
        
        self.admin_user = self.User.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            password='admin123',
            user_type='admin'
        )
        self.admin_token = generate_token(self.admin_user.pk, self.admin_user.email, 'admin')
    
    def test_student_cannot_access_academic_dashboard(self):
        """Test students cannot access academic services dashboard"""
        response = self.client.get(
            '/api/academic/dashboard',
            HTTP_AUTHORIZATION=f'Bearer {self.student_token}'
        )
        self.assertEqual(response.status_code, 403)
    
    def test_admin_can_access_academic_dashboard(self):
        """Test admin can access academic services dashboard"""
        response = self.client.get(
            '/api/academic/dashboard',
            HTTP_AUTHORIZATION=f'Bearer {self.admin_token}'
        )
        self.assertEqual(response.status_code, 200)
