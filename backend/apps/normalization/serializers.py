from rest_framework import serializers

from apps.emissions.models import EmissionComputation

from .models import NormalizedActivity, ValidationIssue


class EmissionComputationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmissionComputation
        fields = ("id", "factor_key", "factor_source", "co2e_kg", "computation_version", "computed_at")


class ValidationIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationIssue
        fields = ("id", "severity", "issue_code", "message", "is_blocking", "rule_version", "created_at")


class NormalizedActivitySerializer(serializers.ModelSerializer):
    validation_issues = ValidationIssueSerializer(many=True, read_only=True)
    emission_computations = EmissionComputationSerializer(many=True, read_only=True)

    class Meta:
        model = NormalizedActivity
        fields = (
            "id",
            "tenant",
            "raw_record",
            "source_type",
            "source_entity_type",
            "activity_date",
            "scope_category",
            "activity_category",
            "quantity_value",
            "quantity_unit_raw",
            "quantity_value_canonical",
            "quantity_unit_canonical",
            "currency",
            "amount",
            "facility_or_plant_code",
            "cost_center",
            "review_status",
            "is_locked",
            "version",
            "validation_issues",
            "emission_computations",
            "created_at",
        )
