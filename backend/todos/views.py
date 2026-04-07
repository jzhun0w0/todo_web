from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Todo
from .serializers import TodoSerializer


class TodoListCreateView(generics.ListCreateAPIView):
    serializer_class = TodoSerializer

    def get_queryset(self):
        return Todo.objects.exclude(status='completed').order_by(
            'urgency_order', 'due_date', '-created_at'
        )

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
    return Response(TodoSerializer(todo).data)


class HistoryListView(generics.ListAPIView):
    serializer_class = TodoSerializer

    def get_queryset(self):
        return Todo.objects.filter(status='completed').order_by('-completed_at')


class HistoryDeleteView(generics.DestroyAPIView):
    queryset = Todo.objects.filter(status='completed')
    serializer_class = TodoSerializer
