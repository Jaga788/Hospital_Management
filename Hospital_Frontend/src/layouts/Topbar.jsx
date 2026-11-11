import { navigation } from '../data/navigation'
import Icon from '../components/Icon'

export default function Topbar({ page, apiError, loading, user, onOpenNavigation, onChangePassword, onLogout }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={onOpenNavigation}>
        <Icon name="menu" />
      </button>
      <div className="breadcrumb">
        <span>Workspace</span>
        <Icon name="chevron" size={15} />
        <strong>{navigation.find((item) => item.id === page)?.label}</strong>
      </div>
      <div className="topbar-actions">
        <span className={`live-indicator ${apiError ? 'live-indicator-offline' : ''}`}>
          <i /> {apiError ? 'API offline' : loading ? 'Connecting' : 'Live data'}
        </span>
        <button className="icon-button notification-button" aria-label="Notifications">
          <Icon name="bell" size={19} /><i />
        </button>
        <button className="button button-secondary account-action" onClick={onChangePassword}>Password</button>
        <button className="button button-secondary account-action" onClick={onLogout}>Sign out</button>
        <span className="account-email">{user?.email}</span>
      </div>
    </header>
  )
}
