// routers/kpiRoute.js

// Importa Express e cria router
const express = require('express')        // <- framework web
const router = express.Router()           // <- instancia de roteador

// Importa helper 'all' para rodar SELECTs agregados
const { all } = require('../models/db')   // <- acesso direto ao banco para KPIs

// GET /api/kpis – retorna contagens para cards do dashboard
router.get('/', async (req, res, next) => {
  try {
    // abertas: manutenções não concluídas
    const abertas = (await all(
      `SELECT COUNT(*) AS n
         FROM manutencoes
        WHERE status IN ('PENDENTE','EM_ANDAMENTO')`
    ))[0].n

    // hoje: agendadas com data_agendada dentro do intervalo do dia corrente
    const start = new Date(); start.setHours(0,0,0,0)          // <- 00:00:00 local
    const end = new Date(); end.setHours(23,59,59,999)         // <- 23:59:59.999 local
    const hoje = (await all(
      `SELECT COUNT(*) AS n
         FROM manutencoes
        WHERE data_agendada IS NOT NULL
          AND datetime(data_agendada) BETWEEN datetime(?) AND datetime(?)`,
      [start.toISOString(), end.toISOString()]
    ))[0].n

    // atrasadas: agendadas no passado e ainda não concluídas
    const atrasadas = (await all(
      `SELECT COUNT(*) AS n
         FROM manutencoes
        WHERE data_agendada IS NOT NULL
          AND datetime(data_agendada) < datetime(?)
          AND status IN ('PENDENTE','EM_ANDAMENTO')`,
      [new Date().toISOString()]
    ))[0].n

    // concluidasMes: concluídas com data_realizada dentro do mês atual
    const now = new Date()                                   // <- data atual
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1) // <- 1º dia do mês
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1) // <- 1º do próximo mês
    const concluidasMes = (await all(
      `SELECT COUNT(*) AS n
         FROM manutencoes
        WHERE status = 'CONCLUIDA'
          AND data_realizada IS NOT NULL
          AND datetime(data_realizada) >= datetime(?)
          AND datetime(data_realizada) <  datetime(?)`,
      [firstDay.toISOString(), nextMonth.toISOString()]
    ))[0].n

    // Resposta consolidada das KPIs
    res.json({ abertas, atrasadas, hoje, concluidasMes })
  } catch (e) { next(e) }                // <- encaminha erro p/ middleware global
})

// Exporta router
module.exports = router
