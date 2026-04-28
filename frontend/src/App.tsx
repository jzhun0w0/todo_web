import { useEffect, useState } from 'react'
import api from './api/axios'
import type { Todo, CreateTodoPayload } from './types'
import AddTaskModal from './components/AddTaskModal'
import TaskCard from './components/TaskCard'
import HistoryTable from './components/HistoryTable'

type Tab = 'tasks' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('tasks')
  const [todos, setTodos] = useState<Todo[]>([])
  const [history, setHistory] = useState<Todo[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // ─── Fetch active tasks ───────────────────────────────────────────
  const fetchTodos = async () => {
    try {
      const res = await api.get<Todo[]>('/todos/')
      setTodos(res.data)
    } catch (e) {
      console.error('Failed to fetch todos', e)
    }
  }

  // ─── Fetch history ────────────────────────────────────────────────
  const fetchHistory = async () => {
    try {
      const res = await api.get<Todo[]>('/history/')
      setHistory(res.data)
    } catch (e) {
      console.error('Failed to fetch history', e)
    }
  }

  useEffect(() => {
    Promise.all([fetchTodos(), fetchHistory()]).finally(() => setLoading(false))
  }, [])

  // Refresh history whenever switching to that tab
  useEffect(() => {
    if (tab === 'history') fetchHistory()
  }, [tab])

  // ─── Create task ──────────────────────────────────────────────────
  const handleCreate = async (payload: CreateTodoPayload) => {
    try {
      const res = await api.post<Todo>('/todos/', payload)
      setTodos(prev => [res.data, ...prev])
      setShowModal(false)
    } catch (e) {
      console.error('Failed to create todo', e)
    }
  }

  // ─── Start timer ──────────────────────────────────────────────────
  const handleStart = async (id: number) => {
    try {
      const res = await api.post<Todo>(`/todos/${id}/start/`)
      setTodos(prev => prev.map(t => t.id === id ? res.data : t))
    } catch (e) {
      console.error('Failed to start todo', e)
    }
  }

  // ─── Complete task (from card OR checkbox) ────────────────────────
  const handleComplete = async (id: number) => {
    try {
      const res = await api.post<Todo>(`/todos/${id}/complete/`)
      // Remove from active list
      setTodos(prev => prev.filter(t => t.id !== id))
      // Prepend to history
      setHistory(prev => [res.data, ...prev])
    } catch (e) {
      console.error('Failed to complete todo', e)
    }
  }

  // ─── Delete active task ───────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/todos/${id}/`)
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      console.error('Failed to delete todo', e)
    }
  }

  // ─── Delete from history ──────────────────────────────────────────
  const handleDeleteHistory = async (id: number) => {
    try {
      await api.delete(`/history/${id}/`)
      setHistory(prev => prev.filter(t => t.id !== id))
    } catch (e) {
      console.error('Failed to delete history item', e)
    }
  }

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

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'tasks' ? 'active' : ''}`}
          onClick={() => setTab('tasks')}
        >
          Active Tasks {todos.length > 0 && `(${todos.length})`}
        </button>
        <button
          className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          History {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* Content */}
      {tab === 'tasks' ? (
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
              />
            ))
          )}
        </div>
      ) : (
        <HistoryTable history={history} onDelete={handleDeleteHistory} />
      )}

      {/* Modal */}
      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  )
}
