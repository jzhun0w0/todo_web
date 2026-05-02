from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Todo, GlobalSettings, RewardItem
from .serializers import TodoSerializer, GlobalSettingsSerializer, RewardItemSerializer


# ─── Helper ──────────────────────────────────────────────────────────────────
# Map task sizes to points for Daily Goal / Cuti Point calculation
SIZE_POINTS = {
    'small': 1,
    'medium': 2,
    'large': 4,
    'extra_large': 8,
}


def get_today_score_before(todo_id, user):
    today = timezone.localdate()
    completed_today = Todo.objects.filter(
        user=user,
        status='completed',
        completed_at__date=today,
    ).exclude(id=todo_id).exclude(size='cuti')
    return sum(SIZE_POINTS.get(t.size, 0) for t in completed_today)


# ─── Todo Views ───────────────────────────────────────────────────────────────
class TodoListCreateView(generics.ListCreateAPIView):
    serializer_class = TodoSerializer

    def get_queryset(self):
        urgency_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        todos = Todo.objects.filter(user=self.request.user).exclude(status='completed')
        return sorted(todos, key=lambda t: (urgency_order.get(t.urgency, 99), t.due_date or '9999-12-31'))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TodoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TodoSerializer

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user)


@api_view(['POST'])
def start_todo(request, pk):
    try:
        todo = Todo.objects.get(pk=pk, user=request.user)
    except Todo.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if todo.status == 'completed':
        return Response({'error': 'Task already completed'}, status=status.HTTP_400_BAD_REQUEST)

    todo.status = 'in_progress'
    todo.started_at = timezone.now()
    todo.save()
    return Response(TodoSerializer(todo).data)


@api_view(['POST'])
def pause_todo(request, pk):
    try:
        todo = Todo.objects.get(pk=pk, user=request.user)
    except Todo.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if todo.status != 'in_progress':
        return Response({'error': 'Task is not in progress'}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()
    if todo.started_at:
        elapsed = int((now - todo.started_at).total_seconds())
        todo.time_spent_seconds = (todo.time_spent_seconds or 0) + elapsed

    todo.status = 'pending'
    todo.started_at = None
    todo.save()
    return Response(TodoSerializer(todo).data)


@api_view(['POST'])
def complete_todo(request, pk):
    try:
        todo = Todo.objects.get(pk=pk, user=request.user)
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

    settings_obj = GlobalSettings.get_settings(request.user)

    if todo.size != 'cuti':  # don't count Cuti Day tasks
        # 1. Always give the custom Reward Points
        settings_obj.reward_points += todo.reward_points

        # 2. Daily Goal is based on task size (small=1, medium=2, large=4, extra_large=8)
        task_goal_points = SIZE_POINTS.get(todo.size, 0)
        old_score = get_today_score_before(todo.id, request.user)
        new_score = old_score + task_goal_points
        goal = settings_obj.daily_goal_score
        
        # Excess points beyond daily goal → cuti_points
        excess = max(0, new_score - goal) - max(0, old_score - goal)
        if excess > 0:
            settings_obj.cuti_points += excess

        settings_obj.save(update_fields=['reward_points', 'cuti_points'])

    return Response(TodoSerializer(todo).data)


class HistoryListView(generics.ListAPIView):
    serializer_class = TodoSerializer

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user, status='completed').order_by('-completed_at')


class HistoryDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TodoSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user, status='completed')


# ─── Settings View ────────────────────────────────────────────────────────────
@api_view(['GET', 'PUT'])
def settings_view(request):
    settings_obj = GlobalSettings.get_settings(request.user)
    if request.method == 'GET':
        return Response(GlobalSettingsSerializer(settings_obj).data)
    elif request.method == 'PUT':
        serializer = GlobalSettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(GlobalSettingsSerializer(GlobalSettings.get_settings(request.user)).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Reward Views ─────────────────────────────────────────────────────────────
class RewardListCreateView(generics.ListCreateAPIView):
    serializer_class = RewardItemSerializer

    def get_queryset(self):
        if not RewardItem.objects.filter(user=self.request.user, name__iexact='cuti reward').exists():
            RewardItem.objects.create(
                user=self.request.user,
                name='Cuti Reward',
                cost_rp=0,
                cost_cuti=5
            )
        return RewardItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RewardDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RewardItemSerializer

    def get_queryset(self):
        return RewardItem.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.name.lower() == 'cuti reward':
            return Response({'error': 'Cannot delete default Cuti Reward'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
def redeem_reward(request, pk):
    try:
        reward = RewardItem.objects.get(pk=pk, user=request.user)
    except RewardItem.DoesNotExist:
        return Response({'error': 'Reward not found'}, status=status.HTTP_404_NOT_FOUND)

    settings_obj = GlobalSettings.get_settings(request.user)

    # Check both balances
    if settings_obj.reward_points < reward.cost_rp:
        return Response({'error': f'Not enough Reward Points (need {reward.cost_rp})'}, status=status.HTTP_400_BAD_REQUEST)
    if settings_obj.cuti_points < reward.cost_cuti:
        return Response({'error': f'Not enough Cuti Points (need {reward.cost_cuti})'}, status=status.HTTP_400_BAD_REQUEST)

    # Deduct both
    settings_obj.reward_points -= reward.cost_rp
    settings_obj.cuti_points -= reward.cost_cuti

    # Build cost description string
    parts = []
    if reward.cost_rp > 0:
        parts.append(f'{reward.cost_rp} Reward Points')
    if reward.cost_cuti > 0:
        parts.append(f'{reward.cost_cuti} Cuti Points')
    cost_desc = ' + '.join(parts) if parts else 'free'

    # Special: Cuti Reward gives a day off
    if reward.name.lower() == 'cuti reward':
        settings_obj.leaves_remaining += 1
        settings_obj.save(update_fields=['cuti_points', 'reward_points', 'leaves_remaining'])
    else:
        settings_obj.save(update_fields=['cuti_points', 'reward_points'])

    Todo.objects.create(
        user=request.user,
        title=f'🎁 {reward.name}',
        description=f'Redeemed for {cost_desc}.',
        urgency='cuti',
        size='cuti',
        status='completed',
        completed_at=timezone.now(),
    )

    return Response(GlobalSettingsSerializer(settings_obj).data)


@api_view(['POST'])
def take_leave(request):
    settings_obj = GlobalSettings.get_settings(request.user)
    if settings_obj.leaves_remaining <= 0:
        return Response({'error': 'No leaves remaining this month'}, status=status.HTTP_400_BAD_REQUEST)

    now = timezone.now()
    settings_obj.leaves_remaining -= 1
    settings_obj.save(update_fields=['leaves_remaining'])

    try:
        Todo.objects.create(
            user=request.user,
            title='🏖️ Cuti Day',
            description='A well-deserved day off!',
            urgency='cuti',
            size='cuti',
            status='completed',
            completed_at=now,
        )
    except Exception as e:
        print(f"[take_leave] Failed to create cuti todo: {e}")

    return Response(GlobalSettingsSerializer(settings_obj).data)
