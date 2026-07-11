import { createStore } from 'vuex'

const TOKEN_KEY = 'tote_token'
const USER_KEY = 'tote_user'

function loadUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || null } catch (_) { return null }
}

export default createStore({
  state: {
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: loadUser(),
    ready: false, // set once we've validated the token (or confirmed none)
  },
  getters: {
    isAuthenticated: (s) => !!s.token && !!s.user,
    isManagement: (s) => s.user && s.user.role === 'management',
    role: (s) => (s.user ? s.user.role : null),
    username: (s) => (s.user ? s.user.username : null),
  },
  mutations: {
    setAuth(state, { token, user }) {
      state.token = token
      state.user = user
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    setUser(state, user) {
      state.user = user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    clearAuth(state) {
      state.token = null
      state.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
    setReady(state, v) { state.ready = v },
  },
  actions: {
    async login({ commit }, { username, password }) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Login failed')
      commit('setAuth', { token: data.token, user: data.user })
      return data.user
    },
    logout({ commit }) {
      commit('clearAuth')
    },
    // Validate the stored token and refresh the user/role from the server.
    async fetchMe({ commit, state }) {
      if (!state.token) { commit('setReady', true); return null }
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) { commit('clearAuth'); return null }
        const data = await res.json()
        commit('setUser', data.user)
        return data.user
      } catch (_) {
        // Network error — keep optimistic local session, don't force logout.
        return state.user
      } finally {
        commit('setReady', true)
      }
    },
  },
})
