// Global fetch interceptor: attaches the bearer token to same-origin /api
// requests and routes 401s to a single handler (logout + redirect to login).
// Installing it here keeps every existing `fetch('/api/...')` call working
// without threading auth headers through each view.

const TOKEN_KEY = 'tote_token'

export function installFetchInterceptor({ onUnauthorized }) {
  const original = window.fetch.bind(window)

  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    const isApi = url.startsWith('/api')
    const isLogin = url.startsWith('/api/auth/login')

    if (isApi && !isLogin) {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        init = { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } }
      }
    }

    return original(input, init).then((res) => {
      if (isApi && !isLogin && res.status === 401) {
        onUnauthorized && onUnauthorized()
      }
      return res
    })
  }
}
