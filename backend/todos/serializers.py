from rest_framework import serializers
from .models import Todo, GlobalSettings, RewardItem


class GlobalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSettings
        fields = [
            'daily_goal_score',
            'cuti_points',
            'monthly_leaves_quota',
            'next_month_leaves_quota',
            'leaves_remaining',
        ]
        read_only_fields = ['cuti_points', 'monthly_leaves_quota', 'leaves_remaining']


class RewardItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardItem
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = '__all__'
        read_only_fields = ['created_at', 'started_at', 'completed_at', 'time_spent_seconds', 'status']
