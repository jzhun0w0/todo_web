import type { Todo } from '../types'

interface Props {
  todo: Todo
  onClose: () => void
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const URGENCY_LABELS: Record<string, string> = {
  low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', critical: '🔴 Critical',
}

const SIZE_LABELS: Record<string, string> = {
  small: 'Small', medium: 'Medium', large: 'Large', extra_large: 'Extra Large'
}

export default function TaskDetailModal({ todo, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <h2>Task Details</h2>
          <button className="icon-btn close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="detail-content">
          <h3 className="detail-title">{todo.title}</h3>
          
          <div className="task-tags detail-tags">
            <span className={`tag tag-urgency-${todo.urgency}`}>
              {URGENCY_LABELS[todo.urgency]}
            </span>
            <span className={`tag tag-size-${todo.size === 'medium' ? 'medium' : todo.size}`}>
              {SIZE_LABELS[todo.size]}
            </span>
            <span className={`tag status-${todo.status}`}>
              Status: {todo.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="detail-section">
            <h4>Description</h4>
            <div className="detail-description">
              {todo.description ? (
                <p>{todo.description}</p>
              ) : (
                <p className="empty-text">No description provided.</p>
              )}
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Due Date</span>
              <span className="value">{todo.has_due_date && todo.due_date ? todo.due_date : 'None'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Expected Time</span>
              <span className="value">{todo.expected_time_minutes ? `${todo.expected_time_minutes}m` : '—'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Time Spent</span>
              <span className="value">{formatDuration(todo.time_spent_seconds)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Created At</span>
              <span className="value">{formatDateTime(todo.created_at)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Completed At</span>
              <span className="value">{formatDateTime(todo.completed_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
