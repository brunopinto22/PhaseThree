from datetime import date

from django.db import models
from django.contrib.auth.models import AbstractUser, Permission
from django.core.exceptions import ObjectDoesNotExist, ValidationError


class Accounts(AbstractUser):
    USER_TYPE = (
        ('admin', 'Admin'),
        ('student', 'Student'),
        ('representative', 'Company Representative'),
        ('teacher', 'Teacher')
    )
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.'
    )
    user_type = models.CharField(max_length=50, choices=USER_TYPE, default='student')
    photo = models.ImageField(upload_to='pfp/', null=True, blank=True)


class Settings(models.Model):
    support_email = models.EmailField(max_length=255, null=False, blank=False)
    student_password = models.CharField(max_length=255, null=False, blank=False)
    teacher_password = models.CharField(max_length=255, null=False, blank=False)
    representative_password = models.CharField(max_length=255, null=False, blank=False)


def validate_pdf(value):
    if not value.name.endswith('.pdf'):
        raise ValidationError("File must be a PDF.")

class Student(models.Model):
    user = models.OneToOneField('Accounts', on_delete=models.CASCADE)

    student_number = models.IntegerField(primary_key=True)

    student_name = models.CharField(max_length=255, null=False, blank=False)
    nationality = models.CharField(max_length=50)
    ident_type = models.CharField(max_length=255, null=False, blank=False)
    ident_doc = models.IntegerField(null=False, blank=False)
    nif = models.IntegerField(null=True, blank=False)
    gender = models.CharField(max_length=12, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=False)
    contact = models.CharField(max_length=15, null=True, blank=True)

    current_year = models.IntegerField(null=False)
    average = models.FloatField(null=True)
    subjects_done = models.IntegerField(null=True)
    student_course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='students_in_course')
    student_branch = models.ForeignKey('Branch', on_delete=models.SET_NULL, related_name='students_in_branch', null=True, blank=True)
    student_ects = models.IntegerField(null=True, blank=False)

    curriculum = models.FileField(upload_to='protected/curriculums/', validators=[validate_pdf], null=True, blank=True)
    calendar = models.ForeignKey('Calendar', on_delete=models.SET_NULL, related_name='students_in_calendar', null=True, blank=True)

    active = models.BooleanField(default=True)

    def __str__(self):
        return self.student_name or f"Student {self.student_number}"

    def add_subject(self, subject_name, state):
        if state not in [1, 2]:
            raise ValueError("State must be either 1 (in progress) or 2 (pending)")

        subject = Subject.objects.create(subject_name=subject_name, state=state, student=self)

        return subject

    def remove_subject(self, subject_id):
        try:
            subject = Subject.objects.get(id_proposal=subject_id)
            if subject.student == self:
                subject.delete()
                return True
            return False
        except ObjectDoesNotExist:
            raise ValueError(f"Subject with id {subject_id} not found for this student")

    def get_subjects(self):
        return Subject.objects.filter(student=self)

    def add_favorite(self, proposal_id):
        if Proposal.objects.get(id_proposal=proposal_id) is None:
            raise ValueError("Proposal with id {proposal_id} not found for this proposal")

        Favorite.objects.create(proposal_id=proposal_id, student=self)

    def remove_favorite(self, proposal_id):
        if Proposal.objects.get(id_proposal=proposal_id) is None:
            raise ValueError("Proposal with id {proposal_id} not found for this proposal")

        proposal = Proposal.objects.get(id_proposal=proposal_id)
        Favorite.objects.get(proposal=proposal, student=self).delete()

    def get_favorites(self):
        return Favorite.objects.filter(student=self)


class Subject(models.Model):
    IN_PROGRESS = 1
    PENDING = 2
    STATE_CHOICES = [
        (IN_PROGRESS, 'In Progress'),
        (PENDING, 'Pending'),
    ]

    id = models.AutoField(primary_key=True)
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='subjects')
    subject_name = models.CharField(max_length=255, null=False, blank=False)
    state = models.IntegerField(choices=STATE_CHOICES, default=PENDING, null=False)

    def __str__(self):
        return f"Subject '{self.subject_name}' - {self.student.student_number}"


class Favorite(models.Model):
    id_favorite = models.AutoField(primary_key=True)
    student = models.ForeignKey('Student', on_delete=models.CASCADE)
    proposal = models.ForeignKey('Proposal', on_delete=models.CASCADE)

    def __str__(self):
        return f"Favorite: {self.id_favorite}"


class Teacher(models.Model):
    user = models.OneToOneField('Accounts', on_delete=models.CASCADE)

    id_teacher = models.AutoField(primary_key=True)
    teacher_name = models.CharField(max_length=255, null=False, blank=False)
    teacher_category = models.CharField(max_length=255, null=False, blank=False)
    active = models.BooleanField(default=True)

    teacher_profile_picture = models.ImageField(upload_to='protected/profile_pics/', null=True, blank=True)

    scientific_area = models.ForeignKey('ScientificArea', on_delete=models.CASCADE)

    def __str__(self):
        return self.teacher_name or f"Teacher {self.id_teacher}"

    def getPermissions(self):
        return Permissions.objects.filter(teacher=self)

    def editPermissions(self, module_name, can_view, can_edit, can_delete):
        perms = self.getPermissions()
        perm = perms.get(module__module_name=module_name)

        if perm is None:
            raise ValueError(f"Module with name {module_name} not found")

        perm.can_view = can_view
        perm.can_edit = can_edit
        perm.can_delete = can_delete
        perm.save()


class Permissions(models.Model):
    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE)
    module = models.ForeignKey('Module', on_delete=models.CASCADE)

    can_view = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ('teacher', 'module')

    def __str__(self):
        return f"{self.module.module_name} Permissions => {self.teacher.teacher_name}"


class Module(models.Model):
    module_name = models.CharField(max_length=255, unique=True, null=False, blank=False)

    def __str__(self):
        return self.module_name


class Course(models.Model):
    id_course = models.AutoField(primary_key=True)
    course_name = models.CharField(max_length=255, null=False, blank=False)
    course_description = models.TextField(null=True, blank=True)
    course_website = models.CharField(max_length=255, null=True, blank=True)

    commission_email  = models.CharField(max_length=255, null=True, blank=True)
    responsible = models.ForeignKey('Teacher', on_delete=models.SET_NULL, related_name='courses_responsible', null=True, blank=True)
    commission = models.ManyToManyField('Teacher', related_name='course_commission', blank=True)

    technologies_active = models.BooleanField()
    methodologies_active = models.BooleanField()
    objectives_active = models.BooleanField()

    scientific_area = models.ForeignKey('ScientificArea', related_name='courses', on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.course_name or f"Course {self.id_course}"

    def add_admin(self, teacher_id):
        try:
            teacher = Teacher.objects.get(id_teacher=teacher_id)
        except Teacher.DoesNotExist:
            raise ValueError(f"Teacher with id {teacher_id} not found")

        if self.commission.filter(id_teacher=teacher_id).exists():
            raise ValueError(f"Teacher with id {teacher_id} is already an admin for this course")

        self.commission.add(teacher)

        if self.commission.count() == 1 and not self.responsible:
            self.set_responsible(teacher_id)

    def remove_admin(self, teacher_id):
        try:
            teacher = Teacher.objects.get(id_teacher=teacher_id)
        except Teacher.DoesNotExist:
            raise ValueError(f"Teacher with id {teacher_id} not found")

        if not self.commission.filter(id_teacher=teacher_id).exists():
            raise ValueError(f"Teacher with id {teacher_id} is not an admin for this course")

        self.commission.remove(teacher)

        if self.commission.count() == 0:
            self.responsible = None
            self.save()

    def set_responsible(self, teacher_id):
        try:
            teacher = Teacher.objects.get(id_teacher=teacher_id)
        except Teacher.DoesNotExist:
            raise ValueError(f"Teacher with id {teacher_id} not found")

        if self.scientific_area != teacher.scientific_area:
            raise ValueError(f"Teacher '{teacher.teacher_name}' does not belong to the same scientific area as the course")

        if self.responsible and self.responsible.id_teacher == teacher_id:
            raise ValueError(f"Teacher with id {teacher_id} is already responsible for this course")

        if not self.commission.filter(id_teacher=teacher_id).exists():
            raise ValueError(f"Teacher with id {teacher_id} is not a commission member for this course")

        self.responsible = teacher
        self.save()

    def add_branch(self, name, acronym, color):
        if self.branches.filter(branch_name=name).exists():
            raise ValueError(f"A branch named '{name}' already exists in this course")

        Branch.objects.create(branch_name=name, branch_acronym=acronym, color=color, id_course=self)

    def remove_branch(self, branch_id):
        try:
            branch = Branch.objects.get(id_branch=branch_id)
        except Branch.DoesNotExist:
            raise ValueError(f"Branch with id {branch_id} not found")

        branch.delete()

    def edit_branch(self, branch_id, name, acronym, color):
        try:
            branch = Branch.objects.get(id_branch=branch_id)
        except Branch.DoesNotExist:
            raise ValueError(f"Branch with id {branch_id} not found")

        if name is not None:
            branch.branch_name = name
        if acronym is not None:
            branch.branch_acronym = acronym
        if color is not None:
            branch.color = color

        branch.save()


class Branch(models.Model):
    id_branch = models.AutoField(primary_key=True)
    branch_name = models.CharField(max_length=255, null=False, blank=False)
    branch_acronym = models.CharField(max_length=255, null=False, blank=False)
    color = models.CharField(max_length=255, null=True, blank=True)

    id_course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='branches')

    def __str__(self):
        return self.branch_name or f"Branch {self.id_branch}"


class ScientificArea(models.Model):
    id_area = models.AutoField(primary_key=True)
    area_name = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return self.area_name or f"Course {self.id_area}"


class Calendar(models.Model):
    SEMESTER_CHOICES = [(1, "1º Semestre"), (2, "2º Semestre")]

    id_calendar = models.AutoField(primary_key=True)

    calendar_year = models.PositiveIntegerField(null=True, blank=False)
    calendar_semester = models.PositiveIntegerField(choices=SEMESTER_CHOICES)

    submission_start = models.DateField(null=False, blank=False)
    submission_end = models.DateField(null=False, blank=False)
    divulgation = models.DateField(null=False, blank=False)
    registrations = models.DateField(null=True, blank=False)
    candidatures = models.DateField(null=False, blank=False)
    placements = models.DateField(null=False, blank=False)

    min_proposals = models.PositiveIntegerField(default=0)
    max_proposals = models.PositiveIntegerField(default=0)

    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='course_calendars')

    def __str__(self):
        return f"{self.calendar_year}/{self.calendar_year+1} - {self.calendar_semester}º Semestre"

    def is_active(self):
        return self.submission_start <= date.today() <= self.placements

    def is_submission_active(self):
        return self.submission_start <= date.today() <= self.submission_end

class Company(models.Model):
    id_company = models.AutoField(primary_key=True)
    company_name = models.CharField(max_length=255, null=False, blank=False)
    company_email = models.EmailField(max_length=255, null=False, blank=False)
    company_address = models.CharField(max_length=255, null=False, blank=False)
    company_postal_code = models.CharField(max_length=10, null=False, blank=False)
    company_nipc = models.IntegerField(null=False, blank=False)
    company_contact = models.CharField(max_length=15, null=True, blank=False)
    company_website = models.CharField(max_length=255, null=True, blank=True)
    company_linkedin = models.CharField(max_length=255, null=True, blank=True)
    active = models.BooleanField(default=True)

    company_admin = models.ForeignKey('Representative', on_delete=models.SET_NULL, related_name='admin_company', null=True, blank=True)

    logo = models.ImageField(upload_to='logo/', null=True, blank=True)

    def __str__(self):
        return self.company_name or f"Company {self.id_company}"


class Representative(models.Model):
    user = models.OneToOneField('Accounts', on_delete=models.CASCADE)

    active = models.BooleanField(default=True)
    id_representative = models.AutoField(primary_key=True)
    representative_name = models.CharField(max_length=255, null=False, blank=False)
    representative_role = models.CharField(max_length=255, null=True, blank=False)
    representative_contact = models.CharField(max_length=15, null=True, blank=True)

    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='representatives')

    def __str__(self):
        return self.representative_name or f"Representative {self.id_representative}"


class Proposal(models.Model):
    PROPOSAL_TYPES = [
        (1, 'Internship'),
        (2, 'Project'),
    ]

    WORK_FORMATS = [
        (1, 'On-site'),
        (2, 'Remote'),
        (3, 'Hybrid'),
    ]

    id_proposal = models.AutoField(primary_key=True)
    calendar_proposal_number = models.PositiveIntegerField(editable=False)
    company = models.ForeignKey('Company', on_delete=models.CASCADE, null=True, related_name='company_proposals')
    proposal_title = models.CharField(max_length=255, null=False, blank=False)
    proposal_description = models.TextField(null=False, blank=False)
    proposal_selection_method = models.TextField(null=False, blank=False)
    proposal_conditions = models.TextField(null=True, blank=False)
    proposal_scheduling  = models.TextField(null=True, blank=False)

    proposal_technologies = models.TextField(null=True, blank=True)
    proposal_methodologies = models.TextField(null=True, blank=True)
    proposal_objectives = models.TextField(null=True, blank=True)

    proposal_type = models.IntegerField(choices=PROPOSAL_TYPES)
    course = models.ForeignKey('Course', on_delete=models.CASCADE)
    branches = models.ManyToManyField('Branch', blank=True)

    work_format = models.CharField(max_length=10, choices=WORK_FORMATS)
    location = models.CharField(max_length=255)
    schedule = models.CharField(max_length=100)
    slots = models.PositiveIntegerField()

    students = models.ManyToManyField('Student', related_name='student_proposals', blank=True)
    company_advisor = models.ForeignKey('Representative', on_delete=models.CASCADE, related_name='company_advisor_proposals', null=True, blank=True)
    isec_advisor = models.ForeignKey('Teacher', on_delete=models.CASCADE, related_name='isec_advisor_proposals', null=True, blank=True)

    calendar = models.ForeignKey('Calendar', on_delete=models.CASCADE, related_name='proposals_calendar', null=False, blank=False)

    proposal_submission_date = models.DateField()

    def __str__(self):
        return self.proposal_title or f"Proposal {self.id_proposal}"

    def save(self, *args, **kwargs):
        if not self.calendar_proposal_number:
            last_number = Proposal.objects.filter(calendar=self.calendar).aggregate(models.Max('calendar_proposal_number'))['calendar_proposal_number__max']
            self.calendar_proposal_number = (last_number or 0) + 1
        super().save(*args, **kwargs)

    def get_slots_left(self):
        return self.slots - len(self.students.all())


class Candidature(models.Model):
    STATE_CHOICES = [
        ('submitted', 'Submitted'),
        ('revision', 'Revision'),
        ('placed', 'Placed'),
        ('protocol_generated', 'Protocol Generated'),
        ('presidency_signature', 'ISEC Signature'),
        ('company_signature', 'Company Signature'),
        ('student_signature', 'Student Signature'),
        ('finished', 'Finished'),
    ]

    id_candidature = models.AutoField(primary_key=True)
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='students_candidatures')
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='pending')

    candidature_submission_date = models.DateField()

    def __str__(self):
        return f"Candidature {self.id_candidature}"


class CandidatureProposal(models.Model):
    STATE_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    candidature = models.ForeignKey('Candidature', on_delete=models.CASCADE, related_name='candidature_proposals')
    proposal = models.ForeignKey('Proposal', on_delete=models.CASCADE, related_name='proposal_candidatures')
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='pending')

    def __str__(self):
        return f"{self.candidature.student} - {self.proposal.proposal_title} - {self.state}"
