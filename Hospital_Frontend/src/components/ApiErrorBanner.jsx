export default function ApiErrorBanner({ error, onRetry }) {
  if (!error) return null

  return (
    <div className="error-banner" role="alert">
      <div>
        <strong>Couldn’t load hospital data</strong>
        <span>{error}. Check that the backend is running and try again.</span>
      </div>
      <button className="button button-secondary" onClick={onRetry}>Try again</button>
    </div>
  )
}
