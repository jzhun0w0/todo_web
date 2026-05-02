import { useState } from 'react'

interface Props {
  onClose: () => void
  onSubmit: (name: string, costRp: number, costCuti: number) => void
}

export default function AddRewardModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [costRp, setCostRp] = useState('')
  const [costCuti, setCostCuti] = useState('')

  const parsedRp = parseInt(costRp, 10) || 0
  const parsedCuti = parseInt(costCuti, 10) || 0
  const isValid = name.trim() && (parsedRp > 0 || parsedCuti > 0)

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit(name.trim(), parsedRp, parsedCuti)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add New Reward</h2>

        <div className="form-group">
          <label>Reward Name</label>
          <input
            type="text"
            placeholder="e.g. Play Video Games"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" fill="#fab005" width="16" height="16">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
            </svg>
            Reward Points Cost <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>— set 0 if not required</span>
          </label>
          <input
            type="number"
            placeholder="0"
            value={costRp}
            min={0}
            onChange={e => setCostRp(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg viewBox="0 0 24 24" fill="#40c057" width="16" height="16">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.484-1.112 2.678 0 1.353.947 2.29 2.122 2.89.59.301 1.272.502 1.96.68.744.192 1.411.365 1.83.666.38.273.68.736.68 1.464 0 .93-.578 1.527-1.254 1.85-.724.346-1.631.426-2.518.318-.62-.075-1.29-.3-1.85-.688a.75.75 0 1 0-.852 1.25c.677.46 1.465.736 2.184.845V18a.75.75 0 0 0 1.5 0v-.81c.712-.11 1.428-.328 2.072-.751 1.106-.723 1.803-1.984 1.803-3.189 0-1.353-.947-2.29-2.122-2.89-.59-.301-1.272-.502-1.96-.68-.744-.192-1.411-.365-1.83-.666-.38-.273-.68-.736-.68-1.464 0-.93.578-1.527 1.254-1.85.724-.346 1.631-.426 2.518-.318.62.075 1.29.3 1.85.688a.75.75 0 1 0 .852-1.25c-.677-.46-1.465-.736-2.184-.845V6Z" clipRule="evenodd" />
            </svg>
            Cuti Points Cost <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>— set 0 if not required</span>
          </label>
          <input
            type="number"
            placeholder="0"
            value={costCuti}
            min={0}
            onChange={e => setCostCuti(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {parsedRp === 0 && parsedCuti === 0 && (name.trim() !== '') && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: -8, marginBottom: 12 }}>
            At least one cost must be greater than 0.
          </p>
        )}

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={!isValid}>
            Create Reward
          </button>
        </div>
      </div>
    </div>
  )
}
