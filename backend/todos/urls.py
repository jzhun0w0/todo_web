from django.urls import path
from . import views

urlpatterns = [
    path('todos/', views.TodoListCreateView.as_view(), name='todo-list-create'),
    path('todos/<int:pk>/', views.TodoDetailView.as_view(), name='todo-detail'),
    path('todos/<int:pk>/start/', views.start_todo, name='todo-start'),
    path('todos/<int:pk>/complete/', views.complete_todo, name='todo-complete'),
    path('history/', views.HistoryListView.as_view(), name='history-list'),
    path('history/<int:pk>/', views.HistoryDeleteView.as_view(), name='history-delete'),
]
