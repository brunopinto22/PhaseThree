# Generated manually for REQ-16: Notification System - Notify Companies about Application Results

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_alter_student_current_year_alter_student_ident_doc_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='settings',
            name='notify_companies_applications',
            field=models.BooleanField(default=True, help_text='Notify companies when students submit candidatures to their proposals'),
        ),
    ]
