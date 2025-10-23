// routers/maquinaRoute.js

// Importa Express e instancia router
const express = require('express')           // <- servidor web
const router = express.Router()              // <- agrupador de rotas

// Importa “repositório” de Máquina (operações no banco)
const Maquina = require('../models/MaquinaBd') // <- camada de dados de máquinas

// GET /api/maquinas?setorId=... – lista máquinas, filtrando opcionalmente por setor
router.get('/', async (req, res, next) => {
  try {
    const { setorId } = req.query           // <- lê filtro da querystring
    const itens = await Maquina.list({ setorId }) // <- busca no banco com/sem filtro
    res.json(itens)                          // <- devolve lista para o front
  } catch (e) { next(e) }                    // <- repassa erros
})

// GET /api/maquinas/:id – busca máquina específica
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Maquina.getById(Number(req.params.id)) // <- busca por id numérico
    if (!item) return res.status(404).json({ error: 'Máquina não encontrada' }) // <- 404 se não existir
    res.json(item)                              // <- devolve a máquina
  } catch (e) { next(e) }
})

// POST /api/maquinas – cria uma máquina
router.post('/', async (req, res, next) => {
  try {
    const { nome, setorId, status, serie } = req.body || {} // <- extrai campos
    if (!nome || !setorId)                                  // <- valida obrigatórios
      return res.status(400).json({ error: 'nome e setorId são obrigatórios' })
    const criado = await Maquina.create({ nome, setorId, status, serie }) // <- insere no banco
    res.status(201).json(criado)                            // <- 201 Created com objeto
  } catch (e) { next(e) }
})

// PUT /api/maquinas/:id – atualiza máquina (aceita parciais)
router.put('/:id', async (req, res, next) => {
  try {
    const atualizado = await Maquina.update(Number(req.params.id), req.body || {}) // <- mescla e atualiza
    res.json(atualizado)                            // <- devolve atualizado
  } catch (e) { next(e) }
})

// DELETE /api/maquinas/:id – remove máquina
router.delete('/:id', async (req, res, next) => {
  try {
    await Maquina.remove(Number(req.params.id))     // <- deleta no banco
    res.status(204).send()                          // <- 204 No Content
  } catch (e) { next(e) }
})

// Exporta router para uso no server
module.exports = router
