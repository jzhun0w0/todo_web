from django.contrib import admin
from .models import Todo

@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    # 在列表页面显示的字段
    list_display = ('title', 'urgency', 'size', 'status', 'has_due_date', 'due_date', 'created_at')
    
    # 可以在后台进行搜索的字段
    search_fields = ('title',)
    
    # 在右侧添加过滤选项
    list_filter = ('status', 'urgency', 'size', 'has_due_date')
    
    # 设置只读字段，防止在后台被意外修改
    readonly_fields = ('created_at',)
