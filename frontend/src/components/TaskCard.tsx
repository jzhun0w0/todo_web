import { useEffect, useState, useRef } from 'react'
import type { Todo } from '../types'

interface Props {
  todo: Todo
  onStart: (id: number) => void
  onPause: (id: number) => void
  onComplete: (id: number) => void
  onDelete: (id: number) => void
  onClick?: () => void
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

const SIZE_SCORE: Record<string, number> = {
  small: 1, medium: 2, large: 4, extra_large: 8, cuti: 10,
}

const URGENCY_LABELS: Record<string, string> = {
  low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', critical: '🔴 Critical', cuti: '—',
}

export default function TaskRow({ todo, onStart, onPause, onComplete, onDelete, onClick }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (todo.status === 'in_progress' && todo.started_at) {
      const startMs = new Date(todo.started_at).getTime()
      const update = () => setElapsed(Math.floor((Date.now() - startMs) / 1000))
      update()
      intervalRef.current = setInterval(update, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [todo.status, todo.started_at])

  const sizeClass = todo.size === 'medium' ? 'tag-size-medium' : `tag-size-${todo.size}`

  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      title="Click to view details"
    >
      {/* Title */}
      <td className="title-cell">{todo.title}</td>

      {/* Urgency */}
      <td>
        {todo.urgency === 'cuti'
          ? <span className="tag tag-cuti">—</span>
          : <span className={`tag tag-urgency-${todo.urgency}`}>{URGENCY_LABELS[todo.urgency]}</span>
        }
      </td>

      {/* Size + score */}
      <td>
        {todo.size === 'cuti'
          ? <span className="tag tag-cuti">—</span>
          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className={`tag ${sizeClass}`}>
                {todo.size === 'extra_large' ? 'Extra Large' : todo.size}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                +{SIZE_SCORE[todo.size] ?? 0}pt
              </span>
            </span>
        }
      </td>

      {/* Due date */}
      <td className="date-cell">
        {todo.has_due_date && todo.due_date
          ? <span style={{ color: isOverdue(todo.due_date) ? 'var(--critical)' : undefined, fontWeight: isOverdue(todo.due_date) ? 600 : undefined }}>
              {todo.due_date}
            </span>
          : '—'
        }
      </td>

      {/* Status / timer */}
      <td className="time-cell">
        {todo.status === 'in_progress'
          ? <span className="task-timer">
              <span className="timer-dot" />
              {formatDuration(elapsed)}
            </span>
          : <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>Pending</span>
        }
      </td>

      {/* Actions */}
      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {/* ✔ Always-visible complete button */}
          <button
            className="icon-btn complete"
            onClick={() => onComplete(todo.id)}
            title="Mark as complete"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>

          {/* ▶ Start  /  ⏸ Pause  — toggles based on status */}
          {todo.status === 'pending' && (
            <button
              className="icon-btn start"
              onClick={() => onStart(todo.id)}
              title="Start timer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </button>
          )}
          {todo.status === 'in_progress' && (
            <button
              className="icon-btn pause"
              onClick={() => onPause(todo.id)}
              title="Pause timer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          )}
          <button
            className="icon-btn delete"
            onClick={() => onDelete(todo.id)}
            title="Delete task"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}
