import { useState } from 'react'
import type { GlobalSettings, RewardItem } from '../types'
import api from '../api/axios'
import EditRewardModal from './EditRewardModal'

interface Props {
  settings: GlobalSettings
  rewards: RewardItem[]
  onSettingsUpdate: (s: GlobalSettings) => void
  onRewardsUpdate: (r: RewardItem[]) => void
  onTakeLeave: () => Promise<void>
  onRedeem: () => Promise<void>
}

export default function RewardPanel({ settings, rewards, onSettingsUpdate, onRewardsUpdate, onTakeLeave, onRedeem }: Props) {
  const [loading, setLoading] = useState(false)
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null)

  // ── Delete Reward ─────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/rewards/${id}/`)
      onRewardsUpdate(rewards.filter(r => r.id !== id))
    } catch (e) { console.error('Failed to delete reward', e) }
  }

  // ── Edit Reward Cost ──────────────────────────────────────────────────────
  const handleSaveEdit = async (id: number, costRp: number, costCuti: number) => {
    try {
      const res = await api.patch<RewardItem>(`/rewards/${id}/`, { cost_rp: costRp, cost_cuti: costCuti })
      onRewardsUpdate(rewards.map(r => r.id === id ? res.data : r))
      setEditingReward(null)
    } catch (e) { console.error('Failed to update reward', e) }
  }

  // ── Redeem Reward ─────────────────────────────────────────────────────────
  const handleRedeem = async (reward: RewardItem) => {
    if (!canAfford(reward)) return
    setLoading(true)
    try {
      const res = await api.post<GlobalSettings>(`/rewards/${reward.id}/redeem/`)
      onSettingsUpdate(res.data)
      await onRedeem()
    } catch (e) { console.error('Failed to redeem reward', e) } finally { setLoading(false) }
  }

  // ── Take Leave ────────────────────────────────────────────────────────────
  const handleTakeLeave = async () => {
    if (settings.leaves_remaining <= 0) return
    setLoading(true)
    try { await onTakeLeave() } finally { setLoading(false) }
  }

  const canAfford = (r: RewardItem) =>
    settings.reward_points >= r.cost_rp && settings.cuti_points >= r.cost_cuti

  const costLabel = (r: RewardItem) => {
    const parts: string[] = []
    if (r.cost_rp > 0) parts.push(`${r.cost_rp} RP`)
    if (r.cost_cuti > 0) parts.push(`${r.cost_cuti} Cuti`)
    return parts.length > 0 ? parts.join(' + ') : 'Free'
  }

  const costClass = (r: RewardItem) => {
    if (r.cost_rp > 0 && r.cost_cuti > 0) return 'cost-both'
    if (r.cost_cuti > 0) return 'cost-cuti'
    return 'cost-rp'
  }

  const affordTooltip = (r: RewardItem) => {
    const parts: string[] = []
    if (r.cost_rp > 0 && settings.reward_points < r.cost_rp)
      parts.push(`${r.cost_rp - settings.reward_points} more RP`)
    if (r.cost_cuti > 0 && settings.cuti_points < r.cost_cuti)
      parts.push(`${r.cost_cuti - settings.cuti_points} more Cuti`)
    return parts.length > 0 ? `Need ${parts.join(' and ')}` : `Redeem for ${costLabel(r)}`
  }

  return (
    <div className="reward-panel">
      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="reward-stats">
        <div className="stat-card">
          <span className="stat-icon" style={{ display: 'flex' }}>
            <svg viewBox="0 0 24 24" fill="#fab005" width="32" height="32">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <div className="stat-value">{settings.reward_points}</div>
            <div className="stat-label">Reward Points</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" style={{ display: 'flex' }}>
            <svg viewBox="0 0 24 24" fill="#40c057" width="32" height="32">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.484-1.112 2.678 0 1.353.947 2.29 2.122 2.89.59.301 1.272.502 1.96.68.744.192 1.411.365 1.83.666.38.273.68.736.68 1.464 0 .93-.578 1.527-1.254 1.85-.724.346-1.631.426-2.518.318-.62-.075-1.29-.3-1.85-.688a.75.75 0 1 0-.852 1.25c.677.46 1.465.736 2.184.845V18a.75.75 0 0 0 1.5 0v-.81c.712-.11 1.428-.328 2.072-.751 1.106-.723 1.803-1.984 1.803-3.189 0-1.353-.947-2.29-2.122-2.89-.59-.301-1.272-.502-1.96-.68-.744-.192-1.411-.365-1.83-.666-.38-.273-.68-.736-.68-1.464 0-.93.578-1.527 1.254-1.85.724-.346 1.631-.426 2.518-.318.62.075 1.29.3 1.85.688a.75.75 0 1 0 .852-1.25c-.677-.46-1.465-.736-2.184-.845V6Z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <div className="stat-value">{settings.cuti_points}</div>
            <div className="stat-label">Cuti Points</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" style={{ display: 'flex' }}>
            <svg viewBox="0 0 24 24" fill="#339af0" width="32" height="32">
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
            </svg>
          </span>
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
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ marginRight: '8px' }}>
            <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.22 17.834a.75.75 0 0 0-1.06 1.06l1.59 1.591a.75.75 0 0 0 1.061-1.06l-1.59-1.59ZM4.5 12a.75.75 0 0 1-.75.75H1.5a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 4.5 12ZM6.166 7.22a.75.75 0 0 0 1.06-1.06L5.636 4.57A.75.75 0 0 0 4.576 5.63l1.59 1.591Z" clipRule="evenodd" />
          </svg>
          Take a Day Off
        </button>
      </div>

      {/* ── Rewards List ──────────────────────────────────────────────── */}
      <div className="reward-content">
        <div className="rewards-list-section">
          <h3 className="section-title">Available Rewards</h3>
          {rewards.length === 0 ? (
            <div className="reward-empty">
              <p>No rewards yet. Click "Add Reward" to create one!</p>
            </div>
          ) : (
            <div className="rewards-list">
              {rewards.map(r => {
                const affordable = canAfford(r)
                const isCutiReward = r.name.toLowerCase() === 'cuti reward'
                return (
                  <div className="reward-item" key={r.id}>
                    <div className="reward-info">
                      <span className="reward-name">{r.name}</span>
                      <div className="reward-cost-badges">
                        {r.cost_rp > 0 && (
                          <span className="cost-badge cost-badge-rp">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style={{ flexShrink: 0 }}>
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                            </svg>
                            {r.cost_rp} RP
                          </span>
                        )}
                        {r.cost_cuti > 0 && (
                          <span className="cost-badge cost-badge-cuti">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style={{ flexShrink: 0 }}>
                              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.484-1.112 2.678 0 1.353.947 2.29 2.122 2.89.59.301 1.272.502 1.96.68.744.192 1.411.365 1.83.666.38.273.68.736.68 1.464 0 .93-.578 1.527-1.254 1.85-.724.346-1.631.426-2.518.318-.62-.075-1.29-.3-1.85-.688a.75.75 0 1 0-.852 1.25c.677.46 1.465.736 2.184.845V18a.75.75 0 0 0 1.5 0v-.81c.712-.11 1.428-.328 2.072-.751 1.106-.723 1.803-1.984 1.803-3.189 0-1.353-.947-2.29-2.122-2.89-.59-.301-1.272-.502-1.96-.68-.744-.192-1.411-.365-1.83-.666-.38-.273-.68-.736-.68-1.464 0-.93.578-1.527 1.254-1.85.724-.346 1.631-.426 2.518-.318.62.075 1.29.3 1.85.688a.75.75 0 1 0 .852-1.25c-.677-.46-1.465-.736-2.184-.845V6Z" clipRule="evenodd" />
                            </svg>
                            {r.cost_cuti} Cuti
                          </span>
                        )}
                        {r.cost_rp === 0 && r.cost_cuti === 0 && (
                          <span className="cost-badge cost-badge-free">Free</span>
                        )}
                      </div>
                    </div>
                    <div className="reward-actions">
                      <button
                        className={`redeem-btn ${!affordable ? 'disabled' : ''}`}
                        onClick={() => handleRedeem(r)}
                        disabled={!affordable || loading}
                        title={affordTooltip(r)}
                      >
                        Redeem
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => setEditingReward(r)}
                        title="Edit reward"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {!isCutiReward && (
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
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Reward Modal ─────────────────────────────────────────── */}
      {editingReward && (
        <EditRewardModal
          reward={editingReward}
          onClose={() => setEditingReward(null)}
          onSubmit={handleSaveEdit}
        />
      )}
    </div>
  )
}
