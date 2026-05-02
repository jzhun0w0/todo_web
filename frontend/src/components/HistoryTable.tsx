import type { Todo } from '../types'

interface Props {
  history: Todo[]
  onDelete: (id: number) => void
  onEdit: (todo: Todo) => void
  onClickTodo: (todo: Todo) => void
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const URGENCY_LABELS: Record<string, string> = {
  low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', critical: '🔴 Critical',
}

export default function HistoryTable({ history, onDelete, onEdit, onClickTodo }: Props) {
  if (history.length === 0) {
    return (
      <div className="history-section">
        <h2>Completed Tasks</h2>
        <div className="empty-state">
          <p>No completed tasks yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-section">
      <h2>Completed Tasks ({history.length})</h2>
      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Urgency</th>
              <th>Size</th>
              <th>Due Date</th>
              <th>Completed At</th>
              <th>Expected Time</th>
              <th>Time Spent</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map(todo => (
              <tr
                key={todo.id}
                onClick={() => onClickTodo(todo)}
                style={{ cursor: 'pointer' }}
                title="Click to view details"
              >
                <td className="title-cell">{todo.title}</td>
                <td>
                  {todo.urgency === 'cuti'
                    ? <span className="tag tag-cuti">—</span>
                    : <span className={`tag tag-urgency-${todo.urgency}`}>{URGENCY_LABELS[todo.urgency]}</span>
                  }
                </td>
                <td>
                  {todo.size === 'cuti'
                    ? <span className="tag tag-cuti">—</span>
                    : <span className={`tag tag-size-${todo.size === 'medium' ? 'medium' : todo.size}`}>
                        {todo.size === 'extra_large' ? 'Extra Large' : todo.size}
                      </span>
                  }
                </td>
                <td className="date-cell">
                  {todo.has_due_date && todo.due_date ? todo.due_date : '—'}
                </td>
                <td className="date-cell">{formatDateTime(todo.completed_at)}</td>
                <td className="time-cell">
                  {todo.expected_time_minutes ? `${todo.expected_time_minutes}m` : '—'}
                </td>
                <td className="time-cell">
                  {todo.time_spent_seconds !== null
                    ? formatDuration(todo.time_spent_seconds)
                    : <span className="no-timer">No timer</span>
                  }
                </td>
                <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <button
                      className="icon-btn edit"
                      onClick={() => onEdit(todo)}
                      title="Edit record"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => onDelete(todo.id)}
                      title="Remove from history"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
