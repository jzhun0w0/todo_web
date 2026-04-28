import { useState } from 'react'
import type { CreateTodoPayload, Todo } from '../types'

interface Props {
  onClose: () => void
  onSubmit: (payload: CreateTodoPayload) => void
}

const URGENCIES: { value: Todo['urgency']; label: string }[] = [
  { value: 'low', label: '🟢 Low' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'high', label: '🟠 High' },
  { value: 'critical', label: '🔴 Critical' },
]

const SIZES: { value: Todo['size']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

export default function AddTaskModal({ onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [urgency, setUrgency] = useState<Todo['urgency']>('medium')
  const [size, setSize] = useState<Todo['size']>('medium')
  const [hasDueDate, setHasDueDate] = useState(false)
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      urgency,
      size,
      has_due_date: hasDueDate,
      due_date: hasDueDate && dueDate ? dueDate : null,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add New Task</h2>

        <div className="form-group">
          <label>Task Title</label>
          <input
            type="text"
            placeholder="What do you need to do?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Urgency</label>
          <div className="chip-group">
            {URGENCIES.map(u => (
              <button
                key={u.value}
                className={`chip ${urgency === u.value ? `selected-${u.value}` : ''}`}
                onClick={() => setUrgency(u.value)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Task Size</label>
          <div className="chip-group">
            {SIZES.map(s => (
              <button
                key={s.value}
                className={`chip ${size === s.value ? (s.value === 'medium' ? 'selected-size-medium' : `selected-${s.value}`) : ''}`}
                onClick={() => setSize(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Due Date</label>
          <div className="toggle-row">
            <button
              className={`toggle ${hasDueDate ? 'on' : ''}`}
              onClick={() => setHasDueDate(!hasDueDate)}
            />
            <span className="toggle-label">{hasDueDate ? 'Has due date' : 'No due date'}</span>
          </div>
          {hasDueDate && (
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ marginTop: 10 }}
            />
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={!title.trim()}>
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}
