import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export default function PasswordChangeDialog({ onClose }) {
  const { changePassword } = useAuth()
  const [values, setValues] = useState({ current_password: '', new_password: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await changePassword(values.current_password, values.new_password)
      onClose()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card password-dialog" role="dialog" aria-modal="true" aria-labelledby="password-title">
        <div className="modal-heading">
          <div><h2 id="password-title">Change password</h2><p>Use a new password with at least 12 characters.</p></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label className="form-field"><span>Current password</span><input type="password" autoComplete="current-password" value={values.current_password} onChange={(event) => setValues({ ...values, current_password: event.target.value })} required /></label>
          <label className="form-field"><span>New password</span><input type="password" autoComplete="new-password" minLength="12" maxLength="128" value={values.new_password} onChange={(event) => setValues({ ...values, new_password: event.target.value })} required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button className="button button-primary" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
