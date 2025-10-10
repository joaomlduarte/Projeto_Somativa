// src/store/ui.js
import { defineStore } from 'pinia'

let _id = 1

export const useUiStore = defineStore('ui', {
  state: () => ({
    toasts: [], // { id, type: 'success'|'error'|'info', message }
  }),

  actions: {
    toast(message, type = 'info', timeoutMs = 3000) {
      const id = _id++
      this.toasts.push({ id, type, message })

      // remove automático após X ms
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id)
      }, timeoutMs)
    },
    success(msg, ms) { this.toast(msg, 'success', ms) },
    error(msg, ms)   { this.toast(msg, 'error', ms) },
    info(msg, ms)    { this.toast(msg, 'info', ms)  },
    remove(id) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    }
  },
})
