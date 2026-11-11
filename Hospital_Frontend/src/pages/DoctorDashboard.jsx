import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import AccountSecurityPanel from '../components/AccountSecurityPanel'
import { apiRequest } from '../services/api'

export default function DoctorDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [patients, setPatients] = useState([])
  const [assignments, setAssignments] = useState([])
  const [phone, setPhone] = useState('')
  const [experience, setExperience] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [current, ownPatients, ownAssignments] = await Promise.all([
        apiRequest('/auth/me'),
        apiRequest('/auth/me/patients'),
        apiRequest('/auth/me/assignments'),
      ])
      setProfile(current.profile)
      setPhone(current.profile.phone)
      setExperience(current.profile.experience ?? '')
      setPatients(ownPatients)
      setAssignments(ownAssignments)
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

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const updated = await apiRequest('/auth/me/doctor-profile', {
        method: 'PATCH',
        body: JSON.stringify({
          phone,
          experience: experience === '' ? null : Number(experience),
        }),
      })
      setProfile(updated)
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
        <div className="portal-heading"><div><p className="portal-eyebrow">DOCTOR PORTAL</p><h1>Your dashboard</h1><p>Review your own profile, assignments, and assigned patients.</p></div></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        {notice && <div className="auth-notice" role="status">{notice}</div>}
        {loading || !profile ? <p className="portal-muted">Loading your information…</p> : (
          <div className="portal-grid">
            <section className="portal-card">
              <h2>Your profile</h2>
              <p className="portal-muted">{profile.name} · {profile.specialization}</p>
              <p><strong>Verification:</strong> {profile.verification_status}</p>
              <p><strong>Professional license:</strong> {profile.license_number}</p>
              <form className="auth-form" onSubmit={saveProfile}>
                <label className="form-field"><span>Phone</span><input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength="20" required /></label>
                <label className="form-field"><span>Years of experience</span><input type="number" value={experience} onChange={(event) => setExperience(event.target.value)} min="0" max="80" /></label>
                <button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
              </form>
            </section>
            <section className="portal-card">
              <h2>Your assignments</h2>
              {assignments.length ? <ul className="portal-list">{assignments.map((item) => <li key={item.id}><strong>Assignment #{item.id}</strong><span>Patient #{item.patient_id} · {item.status}</span><small>{new Date(item.assigned_at).toLocaleString()}</small></li>)}</ul> : <p className="portal-muted">You have no assignments yet.</p>}
            </section>
            <section className="portal-card">
              <h2>Your assigned patients</h2>
              {patients.length ? <ul className="portal-list">{patients.map((patient) => <li key={patient.id}><strong>{patient.name} · #{patient.id}</strong><span>{patient.age} years · {patient.gender} · {patient.status}</span><small>{patient.disease || 'No condition noted'} · {patient.phone}</small></li>)}</ul> : <p className="portal-muted">No patients are assigned to your account.</p>}
            </section>
            <AccountSecurityPanel />
          </div>
        )}
      </div>
    </main>
  )
}
