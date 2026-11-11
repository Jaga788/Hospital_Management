import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function LandingPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="auth-loading">Loading your secure session…</div>
  }

  if (user) {
    const target = user.role === 'ADMIN' ? '/admin' : `/${user.role.toLowerCase()}`
    return <Navigate to={target} replace />
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand" aria-label="CareFlow home">
          care<span>flow</span>
        </div>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <Link to="/login" className="nav-link-button secondary">Login</Link>
          <Link to="/register/patient" className="nav-link-button primary">Register</Link>
        </nav>
      </header>

      <main>
        <section id="home" className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">Modern hospital management</p>
            <h1>Connected care for patients, doctors, and administrators.</h1>
            <p className="hero-text">
              CareFlow simplifies patient tracking, doctor coordination, and hospital workflow management in one secure platform.
            </p>
            <div className="hero-actions">
              <Link to="/register/patient" className="primary-button">Create account</Link>
              <Link to="/login" className="secondary-button">Sign in</Link>
            </div>
            <ul className="hero-points" aria-label="Key platform benefits">
              <li>Secure patient records</li>
              <li>Doctor approval workflow</li>
              <li>Assignment tracking</li>
            </ul>
          </div>

          <div className="hero-panel" aria-label="Hospital management dashboard preview">
            <div className="panel-card panel-main">
              <div className="panel-header">
                <span className="badge success">Live</span>
                <span className="panel-meta">Hospital overview</span>
              </div>
              <div className="metrics-grid">
                <div className="metric-box">
                  <strong>1,284</strong>
                  <span>Patients</span>
                </div>
                <div className="metric-box">
                  <strong>86</strong>
                  <span>Doctors</span>
                </div>
                <div className="metric-box">
                  <strong>96%</strong>
                  <span>Care rate</span>
                </div>
              </div>
            </div>

            <div className="panel-card panel-mini">
              <p>Today&apos;s schedule</p>
              <div className="mini-list">
                <span><i className="dot green" /> 12 appointments</span>
                <span><i className="dot blue" /> 7 follow-ups</span>
                <span><i className="dot amber" /> 3 urgent cases</span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="landing-section about-section">
          <div className="section-heading">
            <p className="eyebrow">About</p>
            <h2>Healthcare operations built for clarity and trust.</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Patient-first care</h3>
              <p>Give patients a secure way to register, view updates, and stay connected with their assigned care team.</p>
            </article>
            <article className="feature-card">
              <h3>Doctor coordination</h3>
              <p>Doctors can register, get reviewed by admins, and access the information needed to support assigned patients.</p>
            </article>
            <article className="feature-card">
              <h3>Admin oversight</h3>
              <p>Administrators manage hospital records, review doctor accounts, and keep assignments organized and transparent.</p>
            </article>
          </div>
        </section>

        <section id="contact" className="landing-section contact-section">
          <div className="section-heading">
            <p className="eyebrow">Contact</p>
            <h2>Let&apos;s support your care operations.</h2>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <h3>Reach us</h3>
              <p>Email: support@careflowhealth.com</p>
              <p>Phone: +1 (555) 204-1188</p>
              <p>Address: 24 Wellness Avenue, Suite 200</p>
            </div>

            <div className="contact-card accent">
              <h3>Get started</h3>
              <p>Register a patient account or sign in to continue.</p>
              <div className="contact-actions">
                <Link to="/register/patient" className="primary-button small">Register</Link>
                <Link to="/login" className="secondary-button small">Login</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
