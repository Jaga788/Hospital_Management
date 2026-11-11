import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import AccountSecurityPanel from '../components/AccountSecurityPanel'
import { apiRequest } from '../services/api'

export default function PatientDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [current, ownAssignments] = await Promise.all([
        apiRequest('/auth/me'),
        apiRequest('/auth/me/assignments'),
      ])
      setAssignments(ownAssignments)
      setForm({
        name: current.profile.name,
        age: current.profile.age,
        gender: current.profile.gender,
        phone: current.profile.phone,
        address: current.profile.address || '',
        disease: current.profile.disease || '',
      })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await apiRequest('/auth/me/patient-profile', {
        method: 'PATCH',
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      })
      setNotice('Your profile was updated.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    let logoutNotice
    try {
      await logout()
    } catch (logoutError) {
      logoutNotice = `Signed out locally, but the server could not revoke the session: ${logoutError.message}`
    } finally {
      navigate('/login', { replace: true, state: logoutNotice ? { notice: logoutNotice } : undefined })
    }
  }

  return (
    <main className="portal-shell">
      <header className="portal-header"><a className="auth-brand" href="/">care<span>flow</span></a><div><span>{user.email}</span><button className="button button-secondary" onClick={signOut}>Sign out</button></div></header>
      <div className="portal-content">
        <div className="portal-heading"><div><p className="portal-eyebrow">PATIENT PORTAL</p><h1>Your dashboard</h1><p>Manage your profile and review your care assignments.</p></div></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {notice && <div className="auth-notice" role="status">{notice}</div>}
        {loading || !form ? <p className="portal-muted">Loading your information…</p> : (
          <div className="portal-grid">
            <section className="portal-card">
              <h2>Your profile</h2>
              <form className="auth-form auth-registration" onSubmit={save}>
                <label className="form-field"><span>Full name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength="100" /></label>
                <label className="form-field"><span>Email</span><input value={user.email} disabled /></label>
                <label className="form-field"><span>Age</span><input type="number" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} min="0" max="130" required /></label>
                <label className="form-field"><span>Gender</span><input value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} required maxLength="20" /></label>
                <label className="form-field"><span>Phone</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required maxLength="20" /></label>
                <label className="form-field"><span>Address</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} maxLength="255" /></label>
                <label className="form-field auth-full"><span>Condition / disease</span><input value={form.disease} onChange={(event) => setForm({ ...form, disease: event.target.value })} maxLength="255" /></label>
                <button className="button button-primary auth-submit auth-full" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
              </form>
            </section>
            <section className="portal-card">
              <h2>Your care assignments</h2>
              {assignments.length ? <ul className="portal-list">{assignments.map((item) => <li key={item.id}><strong>Assignment #{item.id}</strong><span>Doctor #{item.doctor_id} · {item.status}</span><small>{new Date(item.assigned_at).toLocaleString()}</small></li>)}</ul> : <p className="portal-muted">No care assignments are linked to your account yet.</p>}
              <p className="portal-muted">Appointment booking, prescriptions, and medical-record features are not part of the current application.</p>
            </section>
            <AccountSecurityPanel />
          </div>
        )}
      </div>
    </main>
  )
}
