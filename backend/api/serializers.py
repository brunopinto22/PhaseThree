from rest_framework import serializers

from .models import Accounts, Student, Teacher, Company, Representative


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    student_data = serializers.DictField(write_only=True, required=False)
    teacher_data = serializers.DictField(write_only=True, required=False)
    representative_data = serializers.DictField(write_only=True, required=False)
    company_data = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Accounts
        fields = ['email', 'password', 'user_type', 'student_data', 'teacher_data', 'representative_data', 'company_data']

    """
    TODO : ir buscar o código de enviar mail de confirmação na criação de empresas
    """

    def create(self, validated_data):
        user_type = validated_data.pop('user_type')
        email = validated_data.get('email')
        student_data = validated_data.pop('student_data', None)
        teacher_data = validated_data.pop('teacher_data', None)
        representative_data = validated_data.pop('representative_data', None)
        company_data = validated_data.pop('company_data', None)

        if Accounts.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "O Email já está a ser usado."})

        user = Accounts.objects.create_user(**validated_data, user_type=user_type)

        if user_type == 'student' and student_data:
            Student.register(user, student_data)

        elif user_type == 'teacher' and teacher_data:
            Teacher.register(user, teacher_data)

        elif user_type == 'representative' and representative_data and company_data:
            company_id = company_data.get('id')
            if not company_id:
                raise serializers.ValidationError({"company": "Company ID must be provided in companie_data."})

            try:
                    company = Company.objects.get(pk=company_id)
            except Company.DoesNotExist:
                    raise serializers.ValidationError({"company": "A Empresa associada não existe."})

            representative_data['company'] = company
            Representative.register(user, representative_data)

        elif user_type == 'company' and representative_data and company_data:
            c = Company.register(user, company_data)
            r = Representative.register(user, representative_data, company=c)
            c.company_admin = r
        c.save()

        return user

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = '__all__'

class RepresentativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Representative
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = Accounts
        fields = '__all__'

    def get_profile(self, obj):
        if obj.user_type == 'student' and hasattr(obj, 'student'):
            return StudentSerializer(obj.student).data
        elif obj.user_type == 'teacher' and hasattr(obj, 'teacher'):
            return TeacherSerializer(obj.teacher).data
        elif obj.user_type == 'representative' and hasattr(obj, 'representative'):
            return RepresentativeSerializer(obj.representative).data
        elif obj.user_type == 'company' and hasattr(obj, 'company'):
            return CompanySerializer(obj.company).data
        return None
