// routers/kpiRoute.js
const express = require('express')
const router = express.Router()
const { ManutencaoModel } = require('../models/db')

// GET /api/kpis – contagens para os cards do dashboard
router.get('/', async (req, res, next) => {
  try {
    // abertas = não concluídas
    const abertas = await ManutencaoModel.countDocuments({ status: { $in: ['PENDENTE', 'EM_ANDAMENTO'] } })

    // hoje = dataAgendada dentro do dia local
    const start = new Date(); start.setHours(0,0,0,0)
    const end = new Date(); end.setHours(23,59,59,999)
    const hoje = await ManutencaoModel.countDocuments({
      dataAgendada: { $ne: null, $gte: start, $lte: end }
    })

    // atrasadas = agendadas no passado e não concluídas
    const agora = new Date()
    const atrasadas = await ManutencaoModel.countDocuments({
      dataAgendada: { $ne: null, $lt: agora },
      status: { $in: ['PENDENTE', 'EM_ANDAMENTO'] }
    })

    // concluidasMes = concluídas no mês atual (por dataRealizada)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const concluidasMes = await ManutencaoModel.countDocuments({
      status: 'CONCLUIDA',
      dataRealizada: { $ne: null, $gte: firstDay, $lt: nextMonth }
    })

    res.json({ abertas, atrasadas, hoje, concluidasMes })
  } catch (e) { next(e) }
})

module.exports = router
