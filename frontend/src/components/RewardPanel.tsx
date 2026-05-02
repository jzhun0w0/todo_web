import { useState } from 'react'
import type { GlobalSettings, RewardItem } from '../types'
import api from '../api/axios'

interface Props {
  settings: GlobalSettings
  rewards: RewardItem[]
  onSettingsUpdate: (s: GlobalSettings) => void
  onRewardsUpdate: (r: RewardItem[]) => void
  onTakeLeave: () => Promise<void>
}

export default function RewardPanel({ settings, rewards, onSettingsUpdate, onRewardsUpdate, onTakeLeave }: Props) {
  const [newName, setNewName] = useState('')
  const [newCost, setNewCost] = useState('')
  const [nextMonthInput, setNextMonthInput] = useState(settings.next_month_leaves_quota.toString())
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingCost, setEditingCost] = useState('')

  // ── Create Reward ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const cost = parseInt(newCost, 10)
    if (!newName.trim() || isNaN(cost) || cost <= 0) return
    try {
      const res = await api.post<RewardItem>('/rewards/', { name: newName.trim(), cost })
      onRewardsUpdate([...rewards, res.data])
      setNewName('')
      setNewCost('')
    } catch (e) { console.error('Failed to create reward', e) }
  }

  // ── Delete Reward ─────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/rewards/${id}/`)
      onRewardsUpdate(rewards.filter(r => r.id !== id))
    } catch (e) { console.error('Failed to delete reward', e) }
  }

  // ── Edit Reward Cost ──────────────────────────────────────────────────────
  const startEdit = (r: RewardItem) => {
    setEditingId(r.id)
    setEditingCost(r.cost.toString())
  }
  const cancelEdit = () => { setEditingId(null); setEditingCost('') }
  const saveEdit = async (id: number) => {
    const cost = parseInt(editingCost, 10)
    if (isNaN(cost) || cost <= 0) return
    try {
      const res = await api.patch<RewardItem>(`/rewards/${id}/`, { cost })
      onRewardsUpdate(rewards.map(r => r.id === id ? res.data : r))
      cancelEdit()
    } catch (e) { console.error('Failed to update reward', e) }
  }

  // ── Redeem Reward ─────────────────────────────────────────────────────────
  const handleRedeem = async (reward: RewardItem) => {
    if (settings.cuti_points < reward.cost) return
    setLoading(true)
    try {
      const res = await api.post<GlobalSettings>(`/rewards/${reward.id}/redeem/`)
      onSettingsUpdate(res.data)
    } catch (e) { console.error('Failed to redeem reward', e) } finally { setLoading(false) }
  }

  // ── Take Leave ────────────────────────────────────────────────────────────
  const handleTakeLeave = async () => {
    if (settings.leaves_remaining <= 0) return
    setLoading(true)
    try { await onTakeLeave() } finally { setLoading(false) }
  }

  // ── Update Next Month Quota ───────────────────────────────────────────────
  const handleSaveNextMonthQuota = async () => {
    const val = parseInt(nextMonthInput, 10)
    if (isNaN(val) || val < 0) return
    try {
      const res = await api.put<GlobalSettings>('/settings/', { next_month_leaves_quota: val })
      onSettingsUpdate(res.data)
    } catch (e) { console.error('Failed to update quota', e) }
  }

  return (
    <div className="reward-panel">
      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="reward-stats">
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div>
            <div className="stat-value">{settings.cuti_points}</div>
            <div className="stat-label">Cuti Points</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🌴</span>
          <div>
            <div className="stat-value">
              {settings.leaves_remaining}
              <span className="stat-quota"> / {settings.monthly_leaves_quota}</span>
            </div>
            <div className="stat-label">Leaves This Month</div>
          </div>
        </div>
        <button
          className={`take-leave-btn ${settings.leaves_remaining <= 0 ? 'disabled' : ''}`}
          onClick={handleTakeLeave}
          disabled={settings.leaves_remaining <= 0 || loading}
        >
          🏖️ Take a Day Off
        </button>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="reward-content">
        {/* Left: Rewards List */}
        <div className="rewards-list-section">
          <h3 className="section-title">Rewards</h3>
          {rewards.length === 0 ? (
            <div className="reward-empty">
              <p>No rewards yet. Create one on the right to get started!</p>
            </div>
          ) : (
            <div className="rewards-list">
              {rewards.map(r => {
                const canAfford = settings.cuti_points >= r.cost
                const isEditing = editingId === r.id
                return (
                  <div className="reward-item" key={r.id}>
                    <div className="reward-info">
                      <span className="reward-name">{r.name}</span>
                      {isEditing ? (
                        <div className="edit-cost-row">
                          <input
                            type="number"
                            className="edit-cost-input"
                            value={editingCost}
                            min={1}
                            autoFocus
                            onChange={e => setEditingCost(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit(r.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                          />
                          <span className="edit-cost-unit">pts</span>
                          <button className="edit-save-btn" onClick={() => saveEdit(r.id)}>✓</button>
                          <button className="edit-cancel-btn" onClick={cancelEdit}>✕</button>
                        </div>
                      ) : (
                        <span className="reward-cost">{r.cost} pts</span>
                      )}
                    </div>
                    <div className="reward-actions">
                      {!isEditing && (
                        <>
                          <button
                            className={`redeem-btn ${!canAfford ? 'disabled' : ''}`}
                            onClick={() => handleRedeem(r)}
                            disabled={!canAfford || loading}
                            title={!canAfford ? `Need ${r.cost - settings.cuti_points} more points` : `Redeem for ${r.cost} pts`}
                          >
                            Redeem
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => startEdit(r)}
                            title="Edit cost"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(r.id)}
                            title="Delete reward"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="reward-settings-section">
          <h3 className="section-title">Add Reward</h3>
          <div className="create-reward-form">
            <input
              type="text"
              placeholder="Reward name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="cost-row">
              <input
                type="number"
                placeholder="Cuti Points cost"
                value={newCost}
                min={1}
                onChange={e => setNewCost(e.target.value)}
              />
              <button
                className="create-reward-btn"
                onClick={handleCreate}
                disabled={!newName.trim() || !newCost || parseInt(newCost) <= 0}
              >
                Create
              </button>
            </div>
          </div>

          <div className="leave-quota-section">
            <h3 className="section-title">Monthly Leave Quota</h3>
            <p className="quota-hint">Current month: <strong>{settings.monthly_leaves_quota}</strong> days (locked)</p>
            <p className="quota-hint muted">Changes apply next month</p>
            <div className="cost-row">
              <input
                type="number"
                min={0}
                value={nextMonthInput}
                onChange={e => setNextMonthInput(e.target.value)}
              />
              <button className="create-reward-btn" onClick={handleSaveNextMonthQuota}>Save</button>
            </div>
            <p className="quota-hint muted" style={{ marginTop: 8 }}>
              Next month: <strong>{settings.next_month_leaves_quota}</strong> days
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
