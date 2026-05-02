import { useEffect, useState, useRef } from 'react'
import type { Todo } from '../types'

interface Props {
  todo: Todo
  onStart: (id: number) => void
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

export default function TaskCard({ todo, onStart, onComplete, onDelete, onClick }: Props) {
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
    <div className={`task-card urgency-${todo.urgency} ${todo.status === 'in_progress' ? 'in-progress' : ''}`}>
      {/* Checkbox */}
      <div
        className="task-checkbox"
        onClick={(e) => { e.stopPropagation(); onComplete(todo.id); }}
        title="Mark as complete"
      >
        <svg viewBox="0 0 14 14"><polyline points="2,7 6,11 12,3" /></svg>
      </div>

      {/* Body */}
      <div className="task-body" onClick={onClick} style={{ cursor: 'pointer' }}>
        <div className="task-title">{todo.title}</div>
        {todo.description && (
          <div className="task-desc-preview">{todo.description}</div>
        )}
        <div className="task-tags">
          <span className={`tag tag-urgency-${todo.urgency}`}>
            {todo.urgency}
          </span>
          <span className={`tag ${sizeClass}`}>
            {todo.size === 'extra_large' ? 'Extra Large' : todo.size}
          </span>
          {todo.has_due_date && todo.due_date && (
            <span className={`tag ${isOverdue(todo.due_date) ? 'tag-overdue' : 'tag-due'}`}>
              📅 {todo.due_date}
            </span>
          )}
          {todo.status === 'in_progress' && (
            <span className="task-timer">
              <span className="timer-dot" />
              {formatDuration(elapsed)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="task-actions">
        {todo.status === 'pending' && (
          <button
            className="icon-btn start"
            onClick={(e) => { e.stopPropagation(); onStart(todo.id); }}
            title="Start timer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        )}
        {todo.status === 'in_progress' && (
          <button
            className="icon-btn complete"
            onClick={(e) => { e.stopPropagation(); onComplete(todo.id); }}
            title="Complete task"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        )}
        <button
          className="icon-btn delete"
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
          title="Delete task"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
