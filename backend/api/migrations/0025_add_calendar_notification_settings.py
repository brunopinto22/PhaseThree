# Generated manually for REQ-15: Notification System - Notify Companies about New Calendars

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_alter_student_current_year_alter_student_ident_doc_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='settings',
            name='notify_companies_new_calendars',
            field=models.BooleanField(default=True, help_text='Notify companies when new calendars are created'),
        ),
    ]
