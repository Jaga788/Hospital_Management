import Icon from './Icon'

export default function Toast({ toast }) {
  if (!toast) return null

  return (
    <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon"><Icon name={toast.type === 'error' ? 'close' : 'check'} size={15} /></span>
      {toast.message}
    </div>
  )
}
