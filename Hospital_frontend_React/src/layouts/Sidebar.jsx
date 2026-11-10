import { navigation } from '../data/navigation'
import Icon from '../components/Icon'

export default function Sidebar({ page, onNavigate, mobileNavOpen, onClose, waitingCount }) {
  return (
    <>
      {mobileNavOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); onNavigate('overview') }}>
          <span className="brand-mark"><Icon name="heart" size={23} /></span>
          <span className="brand-copy"><strong>care<span>flow</span></strong><small>HOSPITAL MANAGEMENT</small></span>
        </a>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'nav-item-active' : ''}`}
              onClick={() => { onNavigate(item.id); onClose() }}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === 'patients' && waitingCount > 0 && <span className="nav-count">{waitingCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon"><Icon name="heart" size={18} /></div>
            <strong>Care, connected.</strong>
            <p>A little more organized, a lot more human.</p>
          </div>
          <div className="profile">
            <div className="avatar avatar-admin">AD</div>
            <div className="profile-copy"><strong>Admin user</strong><span>Hospital administrator</span></div>
            <button className="icon-button profile-more" aria-label="Profile options"><Icon name="more" size={19} /></button>
          </div>
        </div>
      </aside>
    </>
  )
}
