// src/store/maquinas.js
import { defineStore } from 'pinia'
import api from '../services/api'

export const useMaquinasStore = defineStore('maquinas', {
  state: () => ({
    lista: [],              // todas as máquinas
    carregando: false,
    erro: '',
  }),

  actions: {
    async carregar() {
      try {
        this.carregando = true
        this.erro = ''
        this.lista = (await api.get('/maquinas')).data
      } catch (e) {
        console.error(e)
        this.erro = 'Falha ao carregar máquinas'
      } finally {
        this.carregando = false
      }
    },

    async buscarPorId(id) {
      return (await api.get(`/maquinas/${id}`)).data
    },

    async criar(payload) {
      // payload: { nome, setorId }
      const novo = (await api.post('/maquinas', {
        ...payload, setorId: Number(payload.setorId)
      })).data
      this.lista.push(novo)
      return novo
    },

    async atualizar(id, payload) {
      const atualizado = (await api.put(`/maquinas/${id}`, {
        ...payload, setorId: Number(payload.setorId)
      })).data
      const idx = this.lista.findIndex(m => String(m.id) === String(id))
      if (idx !== -1) this.lista[idx] = atualizado
      return atualizado
    },

    async remover(id) {
      await api.delete(`/maquinas/${id}`)
      this.lista = this.lista.filter(m => String(m.id) !== String(id))
    },
  },
})
