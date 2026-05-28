from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.accounts.models import TenantMembership
from apps.lookups.models import LookupAirport, LookupPlant
from apps.tenants.models import DataSource, Tenant

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo tenant, data sources, lookups, and analyst user"

    def handle(self, *args, **options):
        tenant, _ = Tenant.objects.get_or_create(
            slug="demo-corp",
            defaults={"name": "Demo Corp", "is_active": True},
        )

        for st in (DataSource.SourceType.SAP, DataSource.SourceType.UTILITY, DataSource.SourceType.TRAVEL):
            DataSource.objects.get_or_create(
                tenant=tenant,
                source_type=st,
                name=f"Demo {st}",
                defaults={"is_active": True, "config_version": "v1"},
            )

        for code, name, country in [
            ("PLT01", "Berlin Plant", "DE"),
            ("PL01", "Berlin Plant (legacy SAP code)", "DE"),
            ("Werk", "SAP default plant label (German export)", "DE"),
        ]:
            LookupPlant.objects.get_or_create(
                tenant=tenant,
                plant_code=code,
                defaults={"plant_name": name, "country_code": country, "is_active": True},
            )

        for code, city, country in [("DEL", "Delhi", "IN"), ("BOM", "Mumbai", "IN"), ("FRA", "Frankfurt", "DE")]:
            LookupAirport.objects.get_or_create(
                iata_code=code,
                defaults={"city": city, "country_code": country},
            )

        user, created = User.objects.get_or_create(
            username="analyst",
            defaults={"email": "analyst@demo.local", "is_staff": True},
        )
        if created:
            user.set_password("analyst123")
            user.save()

        TenantMembership.objects.get_or_create(
            tenant=tenant,
            user=user,
            defaults={"role": TenantMembership.Role.ANALYST, "is_active": True},
        )

        self.stdout.write(self.style.SUCCESS(f"Seeded tenant {tenant.id} (slug={tenant.slug})"))
        self.stdout.write(self.style.SUCCESS("Login: analyst / analyst123"))
        self.stdout.write(self.style.SUCCESS(f"Use header X-Tenant-ID: {tenant.id}"))

        from django.core.management import call_command

        call_command("seed_sample_files")
