import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.ingestion.services import (
    create_batch,
    ingest_sap_csv,
    ingest_travel_payload,
    ingest_utility_file,
)
from apps.tenants.models import DataSource, Tenant


class Command(BaseCommand):
    help = "Ingest sample_data/* into demo tenant (SAP, utility, travel)"

    def handle(self, *args, **options):
        tenant = Tenant.objects.filter(slug="demo-corp").first()
        if not tenant:
            self.stderr.write("Run seed_demo first.")
            return

        base = Path(settings.BASE_DIR).parent / "sample_data"
        sap = base / "sap_sample.csv"
        utility = base / "utility_sample.csv"
        travel = base / "travel_sample.json"

        if sap.exists():
            ds = DataSource.objects.get(tenant=tenant, source_type=DataSource.SourceType.SAP)
            batch = create_batch(tenant, ds, "manual_upload", input_ref=sap.name)
            ingest_sap_csv(batch, sap.read_bytes())
            self.stdout.write(self.style.SUCCESS(f"SAP: {batch.status} ({batch.raw_records.count()} rows)"))

        if utility.exists():
            ds = DataSource.objects.get(tenant=tenant, source_type=DataSource.SourceType.UTILITY)
            batch = create_batch(tenant, ds, "manual_upload", input_ref=utility.name)
            ingest_utility_file(batch, utility.read_bytes(), is_zip=False)
            self.stdout.write(self.style.SUCCESS(f"Utility: {batch.status} ({batch.raw_records.count()} rows)"))

        if travel.exists():
            ds = DataSource.objects.get(tenant=tenant, source_type=DataSource.SourceType.TRAVEL)
            bookings = json.loads(travel.read_text(encoding="utf-8"))
            batch = create_batch(tenant, ds, "scheduled_pull", input_ref=travel.name)
            ingest_travel_payload(batch, bookings)
            self.stdout.write(self.style.SUCCESS(f"Travel: {batch.status} ({batch.raw_records.count()} rows)"))
