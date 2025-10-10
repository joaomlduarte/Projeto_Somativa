// src/store/setores.js
import { defineStore } from 'pinia'
import api from '../services/api'

export const useSetoresStore = defineStore('setores', {
  state: () => ({
    lista: [],              // todos os setores
    carregando: false,
    erro: '',
  }),

  actions: {
    async carregar() {
      try {
        this.carregando = true
        this.erro = ''
        this.lista = (await api.get('/setores')).data
      } catch (e) {
        console.error(e)
        this.erro = 'Falha ao carregar setores'
      } finally {
        this.carregando = false
      }
    },

    async buscarPorId(id) {
      return (await api.get(`/setores/${id}`)).data
    },

    async criar(payload) {
      // payload: { nome }
      const novo = (await api.post('/setores', payload)).data
      this.lista.push(novo)
      return novo
    },

    async atualizar(id, payload) {
      const atualizado = (await api.put(`/setores/${id}`, payload)).data
      const idx = this.lista.findIndex(s => String(s.id) === String(id))
      if (idx !== -1) this.lista[idx] = atualizado
      return atualizado
    },

    async remover(id) {
      await api.delete(`/setores/${id}`)
      this.lista = this.lista.filter(s => String(s.id) !== String(id))
    },
  },
})
