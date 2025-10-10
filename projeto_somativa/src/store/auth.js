// src/store/auth.js
import { defineStore } from 'pinia'
import api from '@/services/api'

const LS_KEY = 'smpm_auth_v1'

function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function saveToLS(session) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(session)) } catch {}
}
function clearLS() {
  try { localStorage.removeItem(LS_KEY) } catch {}
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: loadFromLS()?.user || null,
    token: loadFromLS()?.token || null,
  }),
  getters: {
    isAuthed: (s) => !!s.user && !!s.token,
  },
  actions: {
    async login({ email, password }) {
      // 1) Tenta autenticar no json-server em /users
      try {
        const { data } = await api.get('/users', { params: { email, password } })
        if (Array.isArray(data) && data.length) {
          const user = data[0]
          const token = `mock.${user.id}.${Date.now()}` // token fake
          this.user = { id: user.id, name: user.name, email: user.email, role: user.role || 'user' }
          this.token = token
          saveToLS({ user: this.user, token: this.token })
          return { ok: true }
        }
      } catch (e) {
        // segue pro fallback
        console.warn('[auth] /users não disponível, usando fallback local.')
      }

      // 2) Fallback local (não depende do backend)
      const fallback = [
        { id: 1, name: 'Admin', email: 'admin@smpm.local', password: '123456', role: 'admin' },
        { id: 2, name: 'Operador', email: 'oper@smpm.local', password: '123456', role: 'user' }
      ]
      const found = fallback.find(u => u.email === email && u.password === password)
      if (found) {
        const token = `mock.${found.id}.${Date.now()}`
        this.user = { id: found.id, name: found.name, email: found.email, role: found.role }
        this.token = token
        saveToLS({ user: this.user, token: this.token })
        return { ok: true }
      }

      return { ok: false, error: 'Credenciais inválidas' }
    },

    logout() {
      this.user = null
      this.token = null
      clearLS()
    }
  }
})
