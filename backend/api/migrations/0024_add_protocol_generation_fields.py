# Generated manually for REQ-7: Automatic Protocol Generation

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_add_notification_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='candidature',
            name='protocol_file',
            field=models.FileField(blank=True, help_text='Generated protocol document (PDF)', null=True, upload_to='protocols/'),
        ),
        migrations.AddField(
            model_name='candidature',
            name='protocol_generated_date',
            field=models.DateTimeField(blank=True, help_text='Date when protocol was automatically generated', null=True),
        ),
        migrations.AddField(
            model_name='settings',
            name='auto_generate_protocols',
            field=models.BooleanField(default=True, help_text='Automatically generate protocols when candidatures are placed'),
        ),
    ]
