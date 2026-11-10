import { useState } from 'react'
import ApiErrorBanner from '../components/ApiErrorBanner'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
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

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
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
          onOpenNavigation={() => setMobileNavOpen(true)}
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
    </div>
  )
}
