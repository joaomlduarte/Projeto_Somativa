// routers/manutencoesRoute.js

// Importa Express e instancia router
const express = require('express')            // <- framework web
const router = express.Router()               // <- agrupador de rotas

// Importa “repositório” de Manutenções (operações no banco)
const Man = require('../models/manutencoesBd') // <- camada de dados de manutenções

// GET /api/manutencoes?status=&maquinaId=&setor= – lista com filtros
router.get('/', async (req, res, next) => {
  try {
    const { status, maquinaId, setor } = req.query       // <- lê filtros opcionais
    const itens = await Man.list({ status, maquinaId, setor }) // <- busca no banco
    res.json(itens)                                       // <- devolve lista normalizada
  } catch (e) { next(e) }                                  // <- trata erros via middleware
})

// GET /api/manutencoes/:id – busca manutenção por id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Man.getById(Number(req.params.id)) // <- converte id e busca
    if (!item) return res.status(404).json({ error: 'Manutenção não encontrada' })
    res.json(item)                                        // <- devolve manutenção
  } catch (e) { next(e) }
})

// POST /api/manutencoes – cria manutenção
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body || {}                        // <- corpo da requisição
    // Validação mínima de obrigatórios
    if (!payload.maquinaId || !payload.tipo || !payload.descricao) {
      return res.status(400).json({ error: 'maquinaId, tipo e descricao são obrigatórios' })
    }
    const criado = await Man.create(payload)              // <- persiste no banco
    res.status(201).json(criado)                          // <- 201 Created com objeto criado
  } catch (e) { next(e) }
})

// PUT /api/manutencoes/:id – atualização completa (merge interno)
router.put('/:id', async (req, res, next) => {
  try {
    const atualizado = await Man.update(Number(req.params.id), req.body || {}) // <- atualiza
    res.json(atualizado)                                   // <- devolve atualizado
  } catch (e) { next(e) }
})

// PATCH /api/manutencoes/:id – atualização parcial (status/data)
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await Man.patch(Number(req.params.id), req.body || {}) // <- muda status/data
    res.json(updated)                                   // <- devolve parcial atualizado
  } catch (e) { next(e) }
})

// DELETE /api/manutencoes/:id – remove manutenção
router.delete('/:id', async (req, res, next) => {
  try {
    await Man.remove(Number(req.params.id))             // <- deleta
    res.status(204).send()                              // <- 204 No Content
  } catch (e) { next(e) }
})

// Exporta router
module.exports = router
