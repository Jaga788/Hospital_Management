import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { apiRequest } from '../services/api'

function AuthShell({ title, description, children }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="auth-brand" href="/">care<span>flow</span></a>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </section>
    </main>
  )
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-loading">Loading your secure session…</div>
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : `/${user.role.toLowerCase()}`} replace />
  return children
}

export function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice] = useState(() => {
    const savedNotice = window.sessionStorage.getItem('hospital_login_notice')
    window.sessionStorage.removeItem('hospital_login_notice')
    return location.state?.notice || savedNotice
  })

  if (!loading && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : `/${user.role.toLowerCase()}`} replace />
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const loggedInUser = await login(values.email, values.password)
      navigate(loggedInUser.role === 'ADMIN' ? '/admin' : `/${loggedInUser.role.toLowerCase()}`, { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GuestOnly>
      <AuthShell title="Welcome back" description="Sign in to your secure hospital account.">
        {notice && <div className="auth-notice" role="status">{notice}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} required /></label>
          <label className="form-field"><span>Password</span><input type="password" autoComplete="current-password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="auth-links">New patient? <Link to="/register/patient">Create a patient account</Link></p>
        <p className="auth-links">Healthcare professional? <Link to="/register/doctor">Register as a doctor</Link></p>
      </AuthShell>
    </GuestOnly>
  )
}

function RegistrationPage({ role }) {
  const isPatient = role === 'patient'
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState(isPatient
    ? { name: '', email: '', password: '', age: '', gender: 'Female', phone: '', address: '', disease: '' }
    : { name: '', email: '', password: '', specialization: '', phone: '', experience: '', license_number: '' })
  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const payload = { ...values }
    if (isPatient) payload.age = Number(values.age)
    else payload.experience = values.experience === '' ? null : Number(values.experience)
    try {
      await apiRequest(`/auth/register/${role}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const notice = isPatient
        ? 'Registration complete. Sign in to open your patient dashboard.'
        : 'Registration received. Your account is pending administrator approval.'
      navigate('/login', { replace: true, state: { notice } })
    } catch (registrationError) {
      setError(registrationError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GuestOnly>
      <AuthShell
        title={isPatient ? 'Create a patient account' : 'Doctor registration'}
        description={isPatient ? 'Your account is ready to use after registration.' : 'Doctor accounts are reviewed before access is enabled.'}
      >
        <form className="auth-form auth-registration" onSubmit={submit}>
          <label className="form-field"><span>Full name</span><input value={values.name} onChange={update('name')} maxLength="100" autoComplete="name" required /></label>
          <label className="form-field"><span>Email address</span><input type="email" value={values.email} onChange={update('email')} autoComplete="email" required /></label>
          <label className="form-field"><span>Password (at least 12 characters)</span><input type="password" value={values.password} onChange={update('password')} minLength="12" maxLength="128" autoComplete="new-password" required /></label>
          <label className="form-field"><span>Phone number</span><input value={values.phone} onChange={update('phone')} maxLength="20" autoComplete="tel" required /></label>
          {isPatient ? (
            <>
              <label className="form-field"><span>Age</span><input type="number" value={values.age} onChange={update('age')} min="0" max="130" required /></label>
              <label className="form-field"><span>Gender</span><select value={values.gender} onChange={update('gender')}><option>Female</option><option>Male</option><option>Non-binary</option><option>Other</option><option>Prefer not to say</option></select></label>
              <label className="form-field auth-full"><span>Address</span><input value={values.address} onChange={update('address')} maxLength="255" autoComplete="street-address" /></label>
              <label className="form-field auth-full"><span>Condition / disease (optional)</span><input value={values.disease} onChange={update('disease')} maxLength="255" /></label>
            </>
          ) : (
            <>
              <label className="form-field"><span>Specialization</span><input value={values.specialization} onChange={update('specialization')} maxLength="100" required /></label>
              <label className="form-field"><span>Years of experience</span><input type="number" value={values.experience} onChange={update('experience')} min="0" max="80" /></label>
              <label className="form-field auth-full"><span>Professional license number</span><input value={values.license_number} onChange={update('license_number')} minLength="3" maxLength="100" required /></label>
            </>
          )}
          {error && <div className="form-error auth-full" role="alert">{error}</div>}
          <button className="button button-primary auth-submit auth-full" disabled={submitting}>{submitting ? 'Submitting…' : 'Create account'}</button>
        </form>
        <p className="auth-links">Already registered? <Link to="/login">Sign in</Link></p>
        {isPatient
          ? <p className="auth-links">Doctor? <Link to="/register/doctor">Register as a doctor</Link></p>
          : <p className="auth-links">Patient? <Link to="/register/patient">Register as a patient</Link></p>}
      </AuthShell>
    </GuestOnly>
  )
}

export function PatientRegistrationPage() {
  return <RegistrationPage role="patient" />
}

export function DoctorRegistrationPage() {
  return <RegistrationPage role="doctor" />
}
