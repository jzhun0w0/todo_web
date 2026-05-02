from django.db import models


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

    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='medium')
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
    单例模型，用于存储全局设置：每日目标、Cuti Points 余额和每月休假配额。
    """
    daily_goal_score = models.IntegerField(default=10)
    cuti_points = models.IntegerField(default=0)
    # 本月锁定的假日配额（月初从 next_month_leaves_quota 复制）
    monthly_leaves_quota = models.IntegerField(default=100)
    # 用户可随时修改，但下月才生效
    next_month_leaves_quota = models.IntegerField(default=100)
    # 本月剩余假日次数
    leaves_remaining = models.IntegerField(default=100)
    # 用于判断是否需要月初重置，格式 "YYYY-MM"
    last_reset_month = models.CharField(max_length=7, default='')

    def __str__(self):
        return f"Global Settings (Goal: {self.daily_goal_score}, Cuti: {self.cuti_points})"

    @classmethod
    def get_settings(cls):
        from django.utils import timezone
        obj, created = cls.objects.get_or_create(id=1)
        current_month = timezone.localdate().strftime('%Y-%m')
        if obj.last_reset_month != current_month:
            # 月初重置：将下月配额应用到本月
            obj.monthly_leaves_quota = obj.next_month_leaves_quota
            obj.leaves_remaining = obj.next_month_leaves_quota
            obj.last_reset_month = current_month
            obj.save(update_fields=['monthly_leaves_quota', 'leaves_remaining', 'last_reset_month'])
        return obj


class RewardItem(models.Model):
    """
    用户自定义奖励项目，消耗 Cuti Points 兑换。
    """
    name = models.CharField(max_length=255)
    cost = models.IntegerField()  # Cuti Points 费用
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['cost', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.cost} pts)"
