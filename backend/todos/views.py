from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Todo, GlobalSettings, RewardItem
from .serializers import TodoSerializer, GlobalSettingsSerializer, RewardItemSerializer


# ─── Helper ──────────────────────────────────────────────────────────────────
SIZE_POINTS = {
    'small': 1,
    'medium': 2,
    'large': 4,
    'extra_large': 8,
}

def get_today_score_before(todo_id):
    """
    计算今天已完成任务的总分（不包含指定 id 的任务）。
    """
    today = timezone.localdate()
    completed_today = Todo.objects.filter(
        status='completed',
        completed_at__date=today,
    ).exclude(id=todo_id)
    return sum(SIZE_POINTS.get(t.size, 0) for t in completed_today)


# ─── Todo Views ───────────────────────────────────────────────────────────────
class TodoListCreateView(generics.ListCreateAPIView):
    serializer_class = TodoSerializer

    def get_queryset(self):
        urgency_order = {
            'critical': 0,
            'high': 1,
            'medium': 2,
            'low': 3,
        }
        todos = Todo.objects.exclude(status='completed')
        return sorted(todos, key=lambda t: (urgency_order.get(t.urgency, 99), t.due_date or '9999-12-31'))


class TodoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer


@api_view(['POST'])
def start_todo(request, pk):
    try:
        todo = Todo.objects.get(pk=pk)
    except Todo.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if todo.status == 'completed':
        return Response({'error': 'Task already completed'}, status=status.HTTP_400_BAD_REQUEST)

    todo.status = 'in_progress'
    todo.started_at = timezone.now()
    todo.save()
    return Response(TodoSerializer(todo).data)


@api_view(['POST'])
def complete_todo(request, pk):
    try:
        todo = Todo.objects.get(pk=pk)
    except Todo.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    now = timezone.now()
    todo.status = 'completed'
    todo.completed_at = now

    if todo.started_at:
        delta = now - todo.started_at
        todo.time_spent_seconds = int(delta.total_seconds())
    else:
        todo.time_spent_seconds = None

    todo.save()

    # ── Cuti Point 积累逻辑 ──────────────────────────────────────────
    settings = GlobalSettings.get_settings()
    task_points = SIZE_POINTS.get(todo.size, 0)
    old_score = get_today_score_before(todo.id)
    new_score = old_score + task_points
    goal = settings.daily_goal_score

    # 本次任务新增的超额部分
    excess = max(0, new_score - goal) - max(0, old_score - goal)
    if excess > 0:
        settings.cuti_points += excess
        settings.save(update_fields=['cuti_points'])

    return Response(TodoSerializer(todo).data)


class HistoryListView(generics.ListAPIView):
    serializer_class = TodoSerializer

    def get_queryset(self):
        return Todo.objects.filter(status='completed').order_by('-completed_at')


class HistoryDeleteView(generics.DestroyAPIView):
    queryset = Todo.objects.filter(status='completed')
    serializer_class = TodoSerializer


# ─── Settings View ────────────────────────────────────────────────────────────
@api_view(['GET', 'PUT'])
def settings_view(request):
    settings = GlobalSettings.get_settings()
    if request.method == 'GET':
        return Response(GlobalSettingsSerializer(settings).data)
    elif request.method == 'PUT':
        serializer = GlobalSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(GlobalSettingsSerializer(GlobalSettings.get_settings()).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Reward Views ─────────────────────────────────────────────────────────────
class RewardListCreateView(generics.ListCreateAPIView):
    queryset = RewardItem.objects.all()
    serializer_class = RewardItemSerializer


class RewardDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RewardItem.objects.all()
    serializer_class = RewardItemSerializer


@api_view(['POST'])
def redeem_reward(request, pk):
    """消耗 Cuti Points 兑换奖励"""
    try:
        reward = RewardItem.objects.get(pk=pk)
    except RewardItem.DoesNotExist:
        return Response({'error': 'Reward not found'}, status=status.HTTP_404_NOT_FOUND)

    settings = GlobalSettings.get_settings()
    if settings.cuti_points < reward.cost:
        return Response({'error': 'Not enough Cuti Points'}, status=status.HTTP_400_BAD_REQUEST)

    settings.cuti_points -= reward.cost
    settings.save(update_fields=['cuti_points'])
    return Response(GlobalSettingsSerializer(settings).data)


@api_view(['POST'])
def take_leave(request):
    """使用一次当月假日配额，同时将今日目标分数加 10，并在历史中记录一条 Cuti Day"""
    settings = GlobalSettings.get_settings()
    if settings.leaves_remaining <= 0:
        return Response({'error': 'No leaves remaining this month'}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()

    # 扣配额（不再修改 daily_goal_score，由前端将 cuti 记录计入已完成分数）
    settings.leaves_remaining -= 1
    settings.save(update_fields=['leaves_remaining'])

    # 自动在历史中新增一条 Cuti Day 记录
    try:
        Todo.objects.create(
            title='🏖️ Cuti Day',
            description='A well-deserved day off!',
            urgency='cuti',
            size='cuti',
            status='completed',
            completed_at=now,
        )
    except Exception as e:
        # 记录失败不影响主流程，但返回警告
        print(f"[take_leave] Failed to create cuti todo: {e}")

    return Response(GlobalSettingsSerializer(settings).data)
