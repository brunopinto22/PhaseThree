# Generated manually for REQ-17 GDPR Compliance

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_create_protocol_table'),
    ]

    operations = [
        migrations.CreateModel(
            name='Consent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('consent_given', models.BooleanField(default=False)),
                ('consent_date', models.DateTimeField(auto_now_add=True)),
                ('consent_ip', models.GenericIPAddressField(blank=True, null=True)),
                ('consent_withdrawn', models.BooleanField(default=False)),
                ('withdrawal_date', models.DateTimeField(blank=True, null=True)),
                ('privacy_policy_version', models.CharField(default='1.0', max_length=10)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='gdpr_consent', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
