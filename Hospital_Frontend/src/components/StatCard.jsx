import Icon from './Icon'

export default function StatCard({ label, value, icon, tone, note }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-${tone}`}><Icon name={icon} size={19} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
      <div className={`stat-decoration stat-decoration-${tone}`} />
    </article>
  )
}
