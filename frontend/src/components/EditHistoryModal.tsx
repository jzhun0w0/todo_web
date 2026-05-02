import { useState } from 'react'
import type { Todo } from '../types'

interface Props {
  todo: Todo
  onClose: () => void
  onSubmit: (id: number, payload: Partial<Pick<Todo, 'title' | 'description' | 'urgency' | 'size' | 'has_due_date' | 'due_date'>>) => void
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
  { value: 'extra_large', label: 'Extra Large' },
]

export default function EditHistoryModal({ todo, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description ?? '')
  const [urgency, setUrgency] = useState<Todo['urgency']>(
    todo.urgency === 'cuti' ? 'medium' : todo.urgency
  )
  const [size, setSize] = useState<Todo['size']>(
    todo.size === 'cuti' ? 'medium' : todo.size
  )
  const [hasDueDate, setHasDueDate] = useState(todo.has_due_date)
  const [dueDate, setDueDate] = useState(todo.due_date ?? '')

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit(todo.id, {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      urgency,
      size,
      has_due_date: hasDueDate,
      due_date: hasDueDate && dueDate ? dueDate : null,
    })
  }

  const isCuti = todo.urgency === 'cuti' || todo.size === 'cuti'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Edit History Record</h2>

        {isCuti && (
          <div className="cuti-notice">
            ⚠️ This is a Cuti Day record. Urgency and Size cannot be changed.
          </div>
        )}

        <div className="form-group">
          <label>Task Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {!isCuti && (
          <>
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
          </>
        )}

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
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
