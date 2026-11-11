const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  const token = window.sessionStorage.getItem('hospital_access_token')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && token) {
    window.dispatchEvent(new Event('hospital-auth-expired'))
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (typeof body.detail === 'string') {
        message = body.detail
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((issue) => issue.msg || 'Invalid input').join('; ')
      }
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}
