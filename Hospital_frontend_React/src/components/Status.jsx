export default function Status({ value }) {
  const status = (value || 'unknown').toLowerCase().replaceAll('_', ' ')
  return <span className={`status status-${status.replaceAll(' ', '-')}`}>{status}</span>
}
