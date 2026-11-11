import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ApiErrorBanner from '../components/ApiErrorBanner'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import PasswordChangeDialog from '../components/PasswordChangeDialog'
import Toast from '../components/Toast'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout({
  page,
  title,
  subtitle,
  action,
  waitingCount,
  loading,
  apiError,
  toast,
  onNavigate,
  onRefresh,
  children,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const signOut = async () => {
    let notice
    try {
      await logout()
    } catch (error) {
      notice = `Signed out locally, but the server could not revoke the session: ${error.message}`
    }
    navigate('/login', { replace: true, state: notice ? { notice } : undefined })
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        email={user?.email}
        onNavigate={onNavigate}
        mobileNavOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        waitingCount={waitingCount}
      />
      <main className="main-content">
        <Topbar
          page={page}
          apiError={apiError}
          loading={loading}
          user={user}
          onOpenNavigation={() => setMobileNavOpen(true)}
          onChangePassword={() => setPasswordDialogOpen(true)}
          onLogout={signOut}
        />
        <div className="page-wrap">
          <PageHeader
            title={title}
            subtitle={subtitle}
            action={(
              <>
                <button className="button button-secondary" onClick={onRefresh} disabled={loading}>
                  <Icon name="refresh" size={17} /> Refresh
                </button>
                {action}
              </>
            )}
          />
          <ApiErrorBanner error={apiError} onRetry={onRefresh} />
          {children}
          <footer className="page-footer">
            <span>© {new Date().getFullYear()} Careflow Hospital Management</span>
            <span className={apiError ? 'footer-offline' : ''}>
              <i className="footer-dot" />
              {apiError ? 'Hospital API unavailable' : loading ? 'Connecting to hospital API' : 'Connected to hospital API'}
            </span>
          </footer>
        </div>
      </main>
      <Toast toast={toast} />
      {passwordDialogOpen && <PasswordChangeDialog onClose={() => setPasswordDialogOpen(false)} />}
    </div>
  )
}
