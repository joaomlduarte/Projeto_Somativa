// src/store/kpis.js
import { defineStore } from 'pinia'
import api from '../services/api'

export const useKpisStore = defineStore('kpis', {
  state: () => ({
    dados: null,         // objeto retornado por /kpis
    carregando: false,
    erro: null,
  }),

  actions: {
    async carregar() {
      this.carregando = true
      this.erro = null
      try {
        // tenta ler do endpoint /kpis (json-server já tem)
        const { data } = await api.get('/kpis')
        this.dados = data
      } catch (e) {
        // fallback: se não houver /kpis, tenta calcular básico das manutenções
        console.warn('Falha /kpis → usando fallback com /manutencoes', e)
        try {
          const { data: mans } = await api.get('/manutencoes')
          const hojeISO = new Date().toISOString().slice(0, 10)

          const abertas     = mans.filter(m => m.status === 'aberta').length
          const atrasadas   = mans.filter(m => m.status === 'atrasada').length
          const hoje        = mans.filter(m => m.data === hojeISO || m.status === 'hoje').length

          // “concluídas no mês” (mês/ano do sistema)
          const now = new Date()
          const y = now.getFullYear()
          const m = String(now.getMonth() + 1).padStart(2, '0')
          const prefix = `${y}-${m}-`
          const concluidasMes = mans.filter(
            x => x.status === 'concluida' && String(x.data || '').startsWith(prefix)
          ).length

          this.dados = { abertas, atrasadas, hoje, concluidasMes }
        } catch (e2) {
          this.erro = 'Não foi possível obter KPIs.'
          this.dados = null
          console.error(e2)
        }
      } finally {
        this.carregando = false
      }
    },
  },
})
