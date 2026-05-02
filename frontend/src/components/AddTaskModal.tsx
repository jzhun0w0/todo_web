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
  { value: 'extra_large', label: 'Extra Large' },
]

export default function AddTaskModal({ onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<Todo['urgency']>('medium')
  const [size, setSize] = useState<Todo['size']>('medium')
  const [rewardPoints, setRewardPoints] = useState(1)
  const [expectedTime, setExpectedTime] = useState('')
  const [hasDueDate, setHasDueDate] = useState(false)
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    const parsedTime = parseInt(expectedTime, 10)
    onSubmit({
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      urgency,
      size,
      reward_points: rewardPoints,
      expected_time_minutes: !isNaN(parsedTime) && parsedTime > 0 ? parsedTime : null,
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
          <label>Description (Optional)</label>
          <textarea
            placeholder="Add some details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
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

        {/* Reward Points */}
        <div className="form-group">
          <label>Reward Points <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>— earned on completion</span></label>
          <div className="reward-points-row">
            <input
              type="number"
              className="rp-input"
              value={rewardPoints}
              min={1}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 1) setRewardPoints(v)
              }}
            />
            <span className="rp-label">pts</span>
          </div>
        </div>

        {/* Expected Time */}
        <div className="form-group">
          <label>Expected Time (minutes) <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>— optional</span></label>
          <input
            type="number"
            placeholder="e.g. 30"
            value={expectedTime}
            min={1}
            onChange={e => setExpectedTime(e.target.value)}
          />
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
