import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function AccountSecurityPanel() {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await changePassword(currentPassword, newPassword)
      setMessage('Password updated. Please sign in again.')
    } catch (changeError) {
      setError(changeError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="portal-card">
      <h2>Account security</h2>
      <form className="auth-form" onSubmit={submit}>
        <label className="form-field"><span>Current password</span><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label>
        <label className="form-field"><span>New password (12+ characters)</span><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="12" maxLength="128" autoComplete="new-password" required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        {message && <div className="auth-notice" role="status">{message} <Link to="/login">Sign in</Link></div>}
        <button className="button button-primary" disabled={saving}>{saving ? 'Updating…' : 'Change password'}</button>
      </form>
    </section>
  )
}
