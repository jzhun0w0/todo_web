import { useState, useEffect, useRef } from 'react'
import type { GlobalSettings } from '../types'

interface Props {
  settings: GlobalSettings
  onSettingsUpdate: (s: GlobalSettings) => void
  onUpdateSettings: (patch: Partial<GlobalSettings>) => Promise<void>
}

function getNextMonthLabel(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

type SaveStatus = 'idle' | 'saving' | 'saved'

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SettingsPanel({ settings, onUpdateSettings }: Props) {
  const nextMonthLabel = getNextMonthLabel()

  // ── Daily Goal ────────────────────────────────────────────────────────────
  const [goalInput, setGoalInput] = useState(settings.daily_goal_score.toString())
  const [goalStatus, setGoalStatus] = useState<SaveStatus>('idle')
  const debouncedGoal = useDebounce(goalInput, 800)
  const prevGoalRef = useRef(settings.daily_goal_score.toString())

  useEffect(() => {
    setGoalInput(settings.daily_goal_score.toString())
    prevGoalRef.current = settings.daily_goal_score.toString()
  }, [settings.daily_goal_score])

  useEffect(() => {
    if (debouncedGoal === prevGoalRef.current) return
    const val = parseInt(debouncedGoal, 10)
    if (isNaN(val) || val <= 0) return
    setGoalStatus('saving')
    onUpdateSettings({ daily_goal_score: val }).then(() => {
      prevGoalRef.current = debouncedGoal
      setGoalStatus('saved')
      setTimeout(() => setGoalStatus('idle'), 2000)
    })
  }, [debouncedGoal])

  // ── Next Month Quota ──────────────────────────────────────────────────────
  const [quotaInput, setQuotaInput] = useState(settings.next_month_leaves_quota.toString())
  const [quotaStatus, setQuotaStatus] = useState<SaveStatus>('idle')
  const [savedQuotaVal, setSavedQuotaVal] = useState<number | null>(null)
  const debouncedQuota = useDebounce(quotaInput, 800)
  const prevQuotaRef = useRef(settings.next_month_leaves_quota.toString())

  useEffect(() => {
    setQuotaInput(settings.next_month_leaves_quota.toString())
    prevQuotaRef.current = settings.next_month_leaves_quota.toString()
  }, [settings.next_month_leaves_quota])

  useEffect(() => {
    if (debouncedQuota === prevQuotaRef.current) return
    const val = parseInt(debouncedQuota, 10)
    if (isNaN(val) || val < 0) return
    setQuotaStatus('saving')
    onUpdateSettings({ next_month_leaves_quota: val }).then(() => {
      prevQuotaRef.current = debouncedQuota
      setSavedQuotaVal(val)
      setQuotaStatus('saved')
      setTimeout(() => setQuotaStatus('idle'), 3000)
    })
  }, [debouncedQuota])

  const statusBadge = (status: SaveStatus) => {
    if (status === 'saving') return <span className="autosave-badge saving">Saving…</span>
    if (status === 'saved') return <span className="autosave-badge saved">✓ Saved</span>
    return null
  }

  return (
    <div className="settings-panel">

      {/* ══ Task Settings ══ */}
      <div className="settings-section">
        <h3 className="section-title">Task Settings</h3>
        <div className="settings-card">
          <div className="setting-row">
            <div className="setting-info">
              <h4>Daily Goal</h4>
              <p>The total score you aim to complete each day. Small=1, Medium=2, Large=4, Extra Large=8 pts.</p>
            </div>
            <div className="setting-action" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div className="quota-input-group">
                <input
                  type="number"
                  className="quota-input"
                  min={1}
                  value={goalInput}
                  onChange={e => { setGoalInput(e.target.value); setGoalStatus('idle') }}
                />
                <span className="quota-unit">pts</span>
              </div>
              {statusBadge(goalStatus)}
            </div>
          </div>
          {goalStatus === 'saved' && (
            <div className="quota-saved-banner">
              <span className="quota-saved-icon">🎯</span>
              <span>Daily goal updated to <strong>{debouncedGoal} pts</strong>.</span>
            </div>
          )}
        </div>
      </div>

      {/* ══ Leave Quota Settings ══ */}
      <div className="settings-section">
        <h3 className="section-title">Leave Quota Settings</h3>
        <div className="settings-card">
          {/* ── Current Month (locked) ── */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Current Month Quota</h4>
              <p>The number of Cuti Days you can take this month. Locked for the current month.</p>
            </div>
            <div className="setting-value">
              <span className="locked-value">{settings.monthly_leaves_quota} days</span>
            </div>
          </div>

          <div className="setting-divider" />

          {/* ── Next Month (editable) ── */}
          <div className="setting-row">
            <div className="setting-info">
              <h4>Next Month Quota</h4>
              <p>Set the number of Cuti Days starting from <strong>{nextMonthLabel}</strong>.</p>
            </div>
            <div className="setting-action" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div className="quota-input-group">
                <input
                  type="number"
                  className="quota-input"
                  min={0}
                  value={quotaInput}
                  onChange={e => { setQuotaInput(e.target.value); setQuotaStatus('idle'); setSavedQuotaVal(null) }}
                />
                <span className="quota-unit">days</span>
              </div>
              {statusBadge(quotaStatus)}
            </div>
          </div>
          {quotaStatus === 'saved' && savedQuotaVal !== null && (
            <div className="quota-saved-banner">
              <span className="quota-saved-icon">✅</span>
              <span>
                Starting from <strong>{nextMonthLabel}</strong>, your leave quota will be{' '}
                <strong>{savedQuotaVal} day{savedQuotaVal !== 1 ? 's' : ''}</strong>.
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
