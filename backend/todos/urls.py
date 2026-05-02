from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import auth_views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/', auth_views.register, name='auth-register'),
    path('auth/login/',    auth_views.login_view, name='auth-login'),
    path('auth/refresh/',  TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/',       auth_views.me, name='auth-me'),

    # ── Todos ─────────────────────────────────────────────────────────────────
    path('todos/', views.TodoListCreateView.as_view(), name='todo-list-create'),
    path('todos/<int:pk>/', views.TodoDetailView.as_view(), name='todo-detail'),
    path('todos/<int:pk>/start/', views.start_todo, name='todo-start'),
    path('todos/<int:pk>/pause/', views.pause_todo, name='todo-pause'),
    path('todos/<int:pk>/complete/', views.complete_todo, name='todo-complete'),

    # ── History ───────────────────────────────────────────────────────────────
    path('history/', views.HistoryListView.as_view(), name='history-list'),
    path('history/<int:pk>/', views.HistoryDeleteView.as_view(), name='history-detail'),

    # ── Settings ──────────────────────────────────────────────────────────────
    path('settings/', views.settings_view, name='settings'),

    # ── Rewards ───────────────────────────────────────────────────────────────
    path('rewards/', views.RewardListCreateView.as_view(), name='reward-list-create'),
    path('rewards/<int:pk>/', views.RewardDetailView.as_view(), name='reward-detail'),
    path('rewards/<int:pk>/redeem/', views.redeem_reward, name='reward-redeem'),
    path('rewards/take-leave/', views.take_leave, name='take-leave'),
]
