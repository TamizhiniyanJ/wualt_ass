from rest_framework import serializers
from .models import Lead


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "source",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_status(self, value: str) -> str:
        if not value or not value.strip():
            raise serializers.ValidationError("Status cannot be empty.")
        return value
