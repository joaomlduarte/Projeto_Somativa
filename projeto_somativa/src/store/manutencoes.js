// src/store/manutencoes.js
import { defineStore } from 'pinia'
import api from '../services/api'

// Helper interno para garantir array sempre
function asArray(v) {
  if (Array.isArray(v)) return v
  // alguns handlers retornam { data: [...] }
  if (v && Array.isArray(v.data)) return v.data
  return []
}

export const useManutencoesStore = defineStore('manutencoes', {
  state: () => ({
    lista: [],
    filtros: { status: '', setor: '', maquinaId: '' },
  }),

  getters: {
    filtradas: (s) =>
      s.lista.filter(m =>
        (!s.filtros.status    || m.status    === s.filtros.status) &&
        (!s.filtros.setor     || m.setor     === s.filtros.setor) &&
        (!s.filtros.maquinaId || String(m.maquinaId) === String(s.filtros.maquinaId))
      ),
  },

  actions: {
    async carregar() {
      const { data } = await api.get('/manutencoes')
      this.lista = asArray(data)
    },

    async buscarPorId(id) {
      const { data } = await api.get(`/manutencoes/${id}`)
      return data
    },

    async criar(payload) {
      // payload: { titulo, data(YYYY-MM-DD), status, maquinaId:number }
      const { data } = await api.post('/manutencoes', payload)
      // mantém a lista sempre array e adiciona item criado
      this.lista = asArray(this.lista)
      this.lista.push(data)
      return data
    },

    async atualizar(id, payload) {
      const { data } = await api.put(`/manutencoes/${id}`, payload)
      this.lista = asArray(this.lista)
      const idx = this.lista.findIndex(m => String(m.id) === String(id))
      if (idx !== -1) this.lista[idx] = data
      return data
    },

    async mudarStatus(id, status) {
      const { data } = await api.patch(`/manutencoes/${id}`, { status })
      // reflete localmente
      this.lista = asArray(this.lista)
      const idx = this.lista.findIndex(m => String(m.id) === String(id))
      if (idx !== -1) this.lista[idx] = { ...this.lista[idx], status: data.status }
      return data
    },

    async moverData(id, dataStr) {
      const { data } = await api.patch(`/manutencoes/${id}`, { data: dataStr })
      this.lista = asArray(this.lista)
      const idx = this.lista.findIndex(m => String(m.id) === String(id))
      if (idx !== -1) this.lista[idx] = { ...this.lista[idx], data: data.data }
      return data
    },

    async remover(id) {
      await api.delete(`/manutencoes/${id}`)
      this.lista = asArray(this.lista).filter(m => String(m.id) !== String(id))
    },
  },
})
