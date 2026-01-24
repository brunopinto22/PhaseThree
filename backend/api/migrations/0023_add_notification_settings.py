# Generated manually for REQ-6: Placement Results Notification

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_alter_student_current_year_alter_student_ident_doc_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='settings',
            name='notify_placement_students',
            field=models.BooleanField(default=True, help_text='Send placement notifications to students'),
        ),
        migrations.AddField(
            model_name='settings',
            name='notify_placement_companies',
            field=models.BooleanField(default=True, help_text='Send placement notifications to companies'),
        ),
        migrations.AddField(
            model_name='settings',
            name='notify_placement_advisors',
            field=models.BooleanField(default=True, help_text='Send placement notifications to advisors'),
        ),
    ]
