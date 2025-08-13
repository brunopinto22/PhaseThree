from django.apps import AppConfig
import os

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Evita execução dupla apenas em ambiente de desenvolvimento
        run_once = os.environ.get('DJANGO_SETTINGS_MODULE', '') != ''
        if run_once:
            try:
                from django.contrib.auth import get_user_model
                from django.db import DatabaseError

                User = get_user_model()
                admin_email = "admin@localhost.pt"
                admin_password = "admin123"

                try:
                    from api.models import Settings, Module

                    # Verifica se o usuário admin já existe
                    if not User.objects.filter(username="admin").exists():
                        # Cria o usuário admin se não existir
                        User.objects.create_superuser(
                            username="admin",
                            email=admin_email,
                            password=admin_password,
                            is_staff=True,
                            is_superuser=True
                        )
                        print("Admin user created successfully!")
                    else:
                        print("Admin user already exists!")

                    if not Settings.objects.exists():
                        Settings.objects.create(
                            support_email="estagios-lei@isec.pt",
                            student_password="aluno@123",
                            teacher_password="docente@123",
                            representative_password="representante@123",
                        )
                        print("Settings created successfully!")
                    else:
                        print("Settings already exists!")

                    if not Module.objects.exists():
                        Module.objects.create(module_name="Calendários")
                        Module.objects.create(module_name="Cursos")
                        Module.objects.create(module_name="Alunos")
                        Module.objects.create(module_name="Docentes")
                        Module.objects.create(module_name="Empresas")
                        Module.objects.create(module_name="Propostas")
                        Module.objects.create(module_name="Candidaturas")
                        print("Modules created successfully!")
                    else:
                        print("Modules already exists!")

                except DatabaseError as e:
                    print(f"Database error occurred: {e}")

            except Exception as e:
                print(f"Error during admin user creation: {e}")
