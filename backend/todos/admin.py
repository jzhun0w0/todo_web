from django.contrib import admin
from .models import Todo, GlobalSettings, RewardItem

@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'urgency', 'size', 'status', 'has_due_date', 'due_date', 'created_at')
    search_fields = ('title', 'user__username')
    list_filter = ('status', 'urgency', 'size', 'has_due_date')
    readonly_fields = ('created_at',)

@admin.register(GlobalSettings)
class GlobalSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'daily_goal_score', 'cuti_points', 'leaves_remaining', 'last_reset_month')
    search_fields = ('user__username',)

@admin.register(RewardItem)
class RewardItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'cost_rp', 'cost_cuti', 'created_at')
    search_fields = ('name', 'user__username')
    readonly_fields = ('created_at',)
