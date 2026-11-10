import Icon from './Icon'

export default function EmptyState({ title, detail }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name="clipboard" size={19} /></span>
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
}
