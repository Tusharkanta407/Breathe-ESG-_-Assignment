import uuid

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tenants", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantMembership",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("role", models.CharField(choices=[("analyst", "Analyst"), ("admin", "Admin")], default="analyst", max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="memberships", to="tenants.tenant")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="tenant_memberships", to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table": "tenant_memberships"},
        ),
        migrations.AlterUniqueTogether(
            name="tenantmembership",
            unique_together={("tenant", "user")},
        ),
    ]
