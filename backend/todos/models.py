from django.db import models
from django.conf import settings


class Todo(models.Model):
    URGENCY_CHOICES = [
        ('cuti', 'Cuti'),
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    SIZE_CHOICES = [
        ('cuti', 'Cuti'),
        ('small', 'Small'),
        ('medium', 'Medium'),
        ('large', 'Large'),
        ('extra_large', 'Extra Large'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='todos')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='medium')
    reward_points = models.IntegerField(default=1)
    expected_time_minutes = models.IntegerField(null=True, blank=True)
    has_due_date = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class GlobalSettings(models.Model):
    """
    Per-user singleton，存储每个用户的全局设置：每日目标、积分余额和每月休假配额。
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settings')
    daily_goal_score = models.IntegerField(default=10)
    reward_points = models.IntegerField(default=0)
    cuti_points = models.IntegerField(default=0)
    monthly_leaves_quota = models.IntegerField(default=100)
    next_month_leaves_quota = models.IntegerField(default=100)
    leaves_remaining = models.IntegerField(default=100)
    last_reset_month = models.CharField(max_length=7, default='')

    def __str__(self):
        return f"Settings for {self.user.username}"

    @classmethod
    def get_settings(cls, user):
        from django.utils import timezone
        obj, created = cls.objects.get_or_create(user=user)
        current_month = timezone.localdate().strftime('%Y-%m')
        if obj.last_reset_month != current_month:
            obj.monthly_leaves_quota = obj.next_month_leaves_quota
            obj.leaves_remaining = obj.next_month_leaves_quota
            obj.last_reset_month = current_month
            obj.save(update_fields=['monthly_leaves_quota', 'leaves_remaining', 'last_reset_month'])
        return obj


class RewardItem(models.Model):
    """
    用户自定义奖励项目，支持同时消耗 Reward Points 和 Cuti Points。
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rewards')
    name = models.CharField(max_length=255)
    cost_rp = models.IntegerField(default=0)    # Reward Points cost
    cost_cuti = models.IntegerField(default=0)  # Cuti Points cost
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.name} ({self.cost_rp} RP + {self.cost_cuti} Cuti)"
