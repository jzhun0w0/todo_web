import { useEffect, useState } from 'react'
import api from './api/axios'
import type { Todo, CreateTodoPayload, GlobalSettings, RewardItem } from './types'
import AddTaskModal from './components/AddTaskModal'
import TaskCard from './components/TaskCard'
import HistoryTable from './components/HistoryTable'
import TaskDetailModal from './components/TaskDetailModal'
import RewardPanel from './components/RewardPanel'

type Tab = 'tasks' | 'history' | 'rewards'

const DEFAULT_SETTINGS: GlobalSettings = {
  daily_goal_score: 10,
  cuti_points: 0,
  monthly_leaves_quota: 100,
  next_month_leaves_quota: 100,
  leaves_remaining: 100,
}

export default function App() {
  const [tab, setTab] = useState<Tab>('tasks')
  const [todos, setTodos] = useState<Todo[]>([])
  const [history, setHistory] = useState<Todo[]>([])
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [loading, setLoading] = useState(true)

  // ─── Fetch data ───────────────────────────────────────────────────────────
  const fetchTodos = async () => {
    try {
      const res = await api.get<Todo[]>('/todos/')
      setTodos(res.data)
    } catch (e) { console.error('Failed to fetch todos', e) }
  }

  const fetchHistory = async () => {
    try {
      const res = await api.get<Todo[]>('/history/')
      setHistory(res.data)
    } catch (e) { console.error('Failed to fetch history', e) }
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get<GlobalSettings>('/settings/')
      setSettings(res.data)
    } catch (e) { console.error('Failed to fetch settings', e) }
  }

  const fetchRewards = async () => {
    try {
      const res = await api.get<RewardItem[]>('/rewards/')
      setRewards(res.data)
    } catch (e) { console.error('Failed to fetch rewards', e) }
  }

  useEffect(() => {
    Promise.all([fetchTodos(), fetchHistory(), fetchSettings(), fetchRewards()])
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'history') fetchHistory()
  }, [tab])

  // ─── Task actions ─────────────────────────────────────────────────────────
  const handleCreate = async (payload: CreateTodoPayload) => {
    try {
      const res = await api.post<Todo>('/todos/', payload)
      setTodos(prev => [res.data, ...prev])
      setShowModal(false)
    } catch (e) { console.error('Failed to create todo', e) }
  }

  const handleStart = async (id: number) => {
    try {
      const res = await api.post<Todo>(`/todos/${id}/start/`)
      setTodos(prev => prev.map(t => t.id === id ? res.data : t))
    } catch (e) { console.error('Failed to start todo', e) }
  }

  const handleComplete = async (id: number) => {
    try {
      const res = await api.post<Todo>(`/todos/${id}/complete/`)
      setTodos(prev => prev.filter(t => t.id !== id))
      setHistory(prev => [res.data, ...prev])
      // 刷新 settings 以更新 cuti_points
      fetchSettings()
    } catch (e) { console.error('Failed to complete todo', e) }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/todos/${id}/`)
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (e) { console.error('Failed to delete todo', e) }
  }

  const handleDeleteHistory = async (id: number) => {
    try {
      await api.delete(`/history/${id}/`)
      setHistory(prev => prev.filter(t => t.id !== id))
    } catch (e) { console.error('Failed to delete history item', e) }
  }

  const handleTakeLeave = async () => {
    try {
      const res = await api.post<GlobalSettings>('/rewards/take-leave/')
      setSettings(res.data)
      // 刷新 history，显示自动创建的 Cuti Day 记录
      const histRes = await api.get<Todo[]>('/history/')
      setHistory(histRes.data)
    } catch (e) { console.error('Failed to take leave', e) }
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  const handleUpdateGoal = async () => {
    const newGoalStr = prompt('Enter your new daily goal score:', settings.daily_goal_score.toString())
    if (!newGoalStr) return
    const newGoal = parseInt(newGoalStr, 10)
    if (isNaN(newGoal) || newGoal <= 0) {
      alert('Please enter a valid positive number.')
      return
    }
    try {
      const res = await api.put<GlobalSettings>('/settings/', { daily_goal_score: newGoal })
      setSettings(res.data)
    } catch (e) { console.error('Failed to update settings', e) }
  }

  // ─── Daily score calculation ──────────────────────────────────────────────
  const getScore = (size: string) => {
    switch (size) {
      case 'small': return 1
      case 'medium': return 2
      case 'large': return 4
      case 'extra_large': return 8
      case 'cuti': return 10
      default: return 0
    }
  }

  const todayStr = new Date().toDateString()
  const todayScore = history
    .filter(t => t.completed_at && new Date(t.completed_at).toDateString() === todayStr)
    .reduce((sum, t) => sum + getScore(t.size), 0)

  const dailyGoal = settings.daily_goal_score
  const pendingCount = todos.filter(t => t.status === 'pending').length
  const inProgressCount = todos.filter(t => t.status === 'in_progress').length

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div>
          <h1>TaskFlow</h1>
          <div className="header-subtitle">
            {loading ? 'Loading…' : `${pendingCount} pending · ${inProgressCount} in progress`}
          </div>
        </div>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Daily Progress */}
      <div className="daily-progress" onClick={handleUpdateGoal} title="Click to edit Daily Goal">
        <div className="progress-text">
          <span className="progress-title">Daily Goal: <strong>{todayScore} / {dailyGoal}</strong> pts</span>
          <span className="progress-message">
            {todayScore >= dailyGoal
              ? '🎉 Awesome! You reached your daily target!'
              : `🎯 Keep going! You need ${dailyGoal - todayScore} more points.`}
          </span>
        </div>
        <div className="progress-bar-wrap">
          <div
            className={`progress-bar-fill ${todayScore >= dailyGoal ? 'completed' : ''}`}
            style={{ width: `${Math.min((todayScore / dailyGoal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
          Active Tasks {todos.length > 0 && `(${todos.length})`}
        </button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          History {history.length > 0 && `(${history.length})`}
        </button>
        <button className={`tab-btn ${tab === 'rewards' ? 'active' : ''}`} onClick={() => setTab('rewards')}>
          🎁 Rewards {settings.cuti_points > 0 && `(${settings.cuti_points} pts)`}
        </button>
      </div>

      {/* Content */}
      {tab === 'tasks' && (
        <div className="task-list">
          {todos.length === 0 && !loading ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="15" x2="12" y2="15"/>
              </svg>
              <p>No active tasks. Click <strong>Add Task</strong> to get started!</p>
            </div>
          ) : (
            todos.map(todo => (
              <TaskCard
                key={todo.id}
                todo={todo}
                onStart={handleStart}
                onComplete={handleComplete}
                onDelete={handleDelete}
                onClick={() => setSelectedTodo(todo)}
              />
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
      <HistoryTable history={history} onDelete={handleDeleteHistory} onClickTodo={setSelectedTodo} />
      )}

      {tab === 'rewards' && (
        <RewardPanel
          settings={settings}
          rewards={rewards}
          onSettingsUpdate={setSettings}
          onRewardsUpdate={setRewards}
          onTakeLeave={handleTakeLeave}
        />
      )}

      {/* Modals */}
      {showModal && (
        <AddTaskModal onClose={() => setShowModal(false)} onSubmit={handleCreate} />
      )}
      {selectedTodo && (
        <TaskDetailModal todo={selectedTodo} onClose={() => setSelectedTodo(null)} />
      )}
    </div>
  )
}
