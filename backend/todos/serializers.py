from rest_framework import serializers
from .models import Todo


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = '__all__'
        read_only_fields = ['created_at', 'started_at', 'completed_at', 'time_spent_seconds', 'status']
