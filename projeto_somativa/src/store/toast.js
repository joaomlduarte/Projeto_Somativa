// src/stores/toast.js
import { defineStore } from 'pinia'

let idSeq = 1

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] // { id, type: 'success'|'error'|'info', message }
  }),
  actions: {
    push(message, type = 'info', timeoutMs = 3000) {
      const id = idSeq++
      this.toasts.push({ id, type, message })
      setTimeout(() => this.remove(id), timeoutMs)
    },
    success(msg, t = 3000) { this.push(msg, 'success', t) },
    error(msg, t = 5000) { this.push(msg, 'error', t) },
    info(msg, t = 3000) { this.push(msg, 'info', t) },
    remove(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    }
  }
})
