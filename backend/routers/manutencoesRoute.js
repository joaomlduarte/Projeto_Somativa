// routers/manutencoesRoute.js
const express = require('express')
const router = express.Router()

const Man = require('../models/manutencoesBd')
const { ManutencaoModel, MaquinaModel } = require('../models/db')

// GET /api/manutencoes?status=&maquinaId=&setor=
router.get('/', async (req, res, next) => {
  try {
    const { status, maquinaId, setor } = req.query
    const itens = await Man.list({ status, maquinaId, setor })
    res.json(itens)
  } catch (e) { next(e) }
})

// GET /api/manutencoes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Man.getById(Number(req.params.id))
    if (!item) return res.status(404).json({ error: 'Manutenção não encontrada' })
    res.json(item)
  } catch (e) { next(e) }
})

// GET /api/manutencoes/calendar/events – eventos p/ calendário
router.get('/calendar/events', async (req, res, next) => {
  try {
    // 1) Busca todas as manutenções
    const mans = await ManutencaoModel.find().sort({ id: -1 }).lean()

    // 2) Carrega nomes de máquinas de uma vez
    const maquinaIds = [...new Set(mans.map(m => m.maquinaId))]
    const maquinas = await MaquinaModel.find(
      { id: { $in: maquinaIds } },
      { id: 1, nome: 1, _id: 0 }
    ).lean()
    const mapNome = new Map(maquinas.map(m => [m.id, m.nome]))

    // 3) Mapeia para eventos
    const events = mans.map(r => {
      const start = r.dataAgendada || r.dataRealizada || r.createdAt
      const end   = r.dataRealizada || r.dataAgendada || r.createdAt
      return {
        id: r.id,
        title: `${r.tipo} - ${mapNome.get(r.maquinaId) || 'Máquina'}`,
        start,
        end,
        status: r.status
      }
    })

    res.json(events)
  } catch (e) { next(e) }
})

// POST /api/manutencoes
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body || {}
    if (!payload.maquinaId || !payload.tipo || !payload.descricao) {
      return res.status(400).json({ error: 'maquinaId, tipo e descricao são obrigatórios' })
    }
    const criado = await Man.create(payload)
    res.status(201).json(criado)
  } catch (e) { next(e) }
})

// PUT /api/manutencoes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const atualizado = await Man.update(Number(req.params.id), req.body || {})
    res.json(atualizado)
  } catch (e) { next(e) }
})

// PATCH /api/manutencoes/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await Man.patch(Number(req.params.id), req.body || {})
    res.json(updated)
  } catch (e) { next(e) }
})

// DELETE /api/manutencoes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Man.remove(Number(req.params.id))
    res.status(204).send()
  } catch (e) { next(e) }
})

module.exports = router
