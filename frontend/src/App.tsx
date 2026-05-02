import { useEffect, useState } from 'react'
import api from './api/axios'
import type { Todo, CreateTodoPayload, GlobalSettings, RewardItem } from './types'
import AddTaskModal from './components/AddTaskModal'
import TaskRow from './components/TaskCard'
import HistoryTable from './components/HistoryTable'
import TaskDetailModal from './components/TaskDetailModal'
import EditHistoryModal from './components/EditHistoryModal'
import RewardPanel from './components/RewardPanel'
import AddRewardModal from './components/AddRewardModal'
import SettingsPanel from './components/SettingsPanel'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

type Tab = 'tasks' | 'history' | 'rewards' | 'settings'

const DEFAULT_SETTINGS: GlobalSettings = {
  daily_goal_score: 10,
  reward_points: 0,
  cuti_points: 0,
  monthly_leaves_quota: 100,
  next_month_leaves_quota: 100,
  leaves_remaining: 100,
}

// ── Auth shell：在顶层做路由判断，不持有业务 hook ─────────────────────────────
export default function App() {
  const { user, authLoading, logout } = useAuth()

  if (authLoading) return <div className="app-loading"><div className="app-loading-spinner" /></div>
  if (!user) return <LoginPage />

  return <AppMain username={user.username} logout={logout} />
}

// ── 主应用：所有 hook 都在这里，保证 hook 调用顺序稳定 ────────────────────────
function AppMain({ username, logout }: { username: string; logout: () => void }) {
  const [tab, setTab] = useState<Tab>('tasks')
  const [todos, setTodos] = useState<Todo[]>([])
  const [history, setHistory] = useState<Todo[]>([])
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [editingHistory, setEditingHistory] = useState<Todo | null>(null)
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

  const handlePause = async (id: number) => {
    try {
      const res = await api.post<Todo>(`/todos/${id}/pause/`)
      setTodos(prev => prev.map(t => t.id === id ? res.data : t))
    } catch (e) { console.error('Failed to pause todo', e) }
  }

  const handleComplete = async (id: number) => {
    try {
      const res = await api.post<Todo>(`/todos/${id}/complete/`)
      setTodos(prev => prev.filter(t => t.id !== id))
      setHistory(prev => [res.data, ...prev])
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

  const handleUpdateHistory = async (
    id: number,
    payload: Partial<Pick<Todo, 'title' | 'description' | 'urgency' | 'size' | 'has_due_date' | 'due_date'>>
  ) => {
    try {
      const res = await api.patch<Todo>(`/history/${id}/`, payload)
      setHistory(prev => prev.map(t => t.id === id ? res.data : t))
      setEditingHistory(null)
    } catch (e) { console.error('Failed to edit history item', e) }
  }

  const handleCreateReward = async (name: string, costRp: number, costCuti: number) => {
    try {
      const res = await api.post<RewardItem>('/rewards/', { name, cost_rp: costRp, cost_cuti: costCuti })
      setRewards([...rewards, res.data])
      setShowRewardModal(false)
    } catch (e) { console.error('Failed to create reward', e) }
  }

  const handleTakeLeave = async () => {
    try {
      const res = await api.post<GlobalSettings>('/rewards/take-leave/')
      setSettings(res.data)
      const histRes = await api.get<Todo[]>('/history/')
      setHistory(histRes.data)
    } catch (e) { console.error('Failed to take leave', e) }
  }

  const handleRedeemReward = async () => {
    fetchHistory()
    fetchSettings()
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  const handleUpdateSettings = async (patch: Partial<GlobalSettings>) => {
    try {
      const res = await api.put<GlobalSettings>('/settings/', patch)
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
    .filter(t => t.completed_at && new Date(t.completed_at).toDateString() === todayStr && t.size !== 'cuti')
    .reduce((sum, t) => sum + getScore(t.size), 0)

  const dailyGoal = settings.daily_goal_score
  const pendingCount = todos.filter(t => t.status === 'pending').length
  const inProgressCount = todos.filter(t => t.status === 'in_progress').length

  // ─── Render ───────────────────────────────────────────────────────────────
  const getPageTitle = () => {
    switch(tab) {
      case 'tasks': return 'Active Tasks'
      case 'history': return 'History'
      case 'rewards': return 'Rewards'
      case 'settings': return 'Settings'
    }
  }

  return (
    <div className="app-layout">
      {/* ─── Sidebar ────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="15" x2="12" y2="15"/>
            </svg>
          </div>
          <h1 className="sidebar-title">TaskFlow</h1>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Tasks
            {todos.length > 0 && <span className="nav-badge">{todos.length}</span>}
          </button>
          
          <button className={`nav-item ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            History
          </button>

          <button className={`nav-item ${tab === 'rewards' ? 'active' : ''}`} onClick={() => setTab('rewards')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect x="2" y="7" width="20" height="5"></rect>
              <line x1="12" y1="22" x2="12" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
            Rewards
            {(settings.reward_points > 0 || settings.cuti_points > 0) && (
              <span className="nav-badge accent">{settings.reward_points}⭐</span>
            )}
          </button>

          <button className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <span className="user-name">{username}</span>
              <button className="logout-link" onClick={logout}>Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-titles">
            <h2>{getPageTitle()}</h2>
            <div className="header-subtitle">
              {loading ? 'Loading…' : `${pendingCount} pending · ${inProgressCount} in progress`}
            </div>
          </div>
          
          {tab === 'tasks' && (
            <button className="add-btn" onClick={() => setShowModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Task
            </button>
          )}

          {tab === 'rewards' && (
            <button className="add-btn" onClick={() => setShowRewardModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Reward
            </button>
          )}
        </header>
      <div className="page-content">
        {tab === 'tasks' && (
          <div className="tasks-page">
            <div className="daily-progress">
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

            <div className="history-table-wrap">
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
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Urgency</th>
                      <th>Size</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todos.map(todo => (
                      <TaskRow
                        key={todo.id}
                        todo={todo}
                        onStart={handleStart}
                        onPause={handlePause}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                        onClick={() => setSelectedTodo(todo)}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'history' && (
        <HistoryTable
          history={history}
          onDelete={handleDeleteHistory}
          onEdit={setEditingHistory}
          onClickTodo={setSelectedTodo}
        />
        )}

        {tab === 'rewards' && (
          <RewardPanel
            settings={settings}
            rewards={rewards}
            onSettingsUpdate={setSettings}
            onRewardsUpdate={setRewards}
            onTakeLeave={handleTakeLeave}
            onRedeem={handleRedeemReward}
          />
        )}

        {tab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onSettingsUpdate={setSettings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </div>
      </main>

      {/* ─── Modals ──────────────────────────────────────────────── */}
      {showModal && <AddTaskModal onClose={() => setShowModal(false)} onSubmit={handleCreate} />}
      {showRewardModal && <AddRewardModal onClose={() => setShowRewardModal(false)} onSubmit={handleCreateReward} />}
      {selectedTodo && <TaskDetailModal todo={selectedTodo} onClose={() => setSelectedTodo(null)} />}
      {editingHistory && (
        <EditHistoryModal
          todo={editingHistory}
          onClose={() => setEditingHistory(null)}
          onSubmit={handleUpdateHistory}
        />
      )}
    </div>
  )
}
