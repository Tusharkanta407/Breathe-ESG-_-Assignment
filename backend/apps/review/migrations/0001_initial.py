import uuid

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("normalization", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReviewDecision",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("decision", models.CharField(choices=[("approve", "Approve"), ("reject", "Reject")], max_length=10)),
                ("comment", models.TextField(blank=True)),
                ("decided_at", models.DateTimeField(auto_now_add=True)),
                ("activity", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="review_decisions", to="normalization.normalizedactivity")),
                ("reviewer", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name="review_decisions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table": "review_decisions"},
        ),
    ]
