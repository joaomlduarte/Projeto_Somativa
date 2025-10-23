// routers/setoresRoute.js

// Importa Express e cria um roteador
const express = require('express')         // <- framework web
const router = express.Router()            // <- instância de router

// Importa o “repositório” de Setor (operações no banco)
const Setor = require('../models/SetorBd') // <- camada de dados de setores

// GET /api/setores – lista todos os setores
router.get('/', async (req, res, next) => {
  try {
    const itens = await Setor.list()       // <- busca lista no banco
    res.json(itens)                        // <- devolve como JSON
  } catch (e) { next(e) }                  // <- encaminha erro p/ middleware global
})

// GET /api/setores/:id – busca um setor específico
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Setor.getById(Number(req.params.id)) // <- converte param p/ número
    if (!item) return res.status(404).json({ error: 'Setor não encontrado' }) // <- 404 se não achar
    res.json(item)                                          // <- devolve setor
  } catch (e) { next(e) }
})

// POST /api/setores – cria um setor
router.post('/', async (req, res, next) => {
  try {
    const { nome } = req.body || {}       // <- extrai nome do corpo
    if (!nome)                             // <- valida campo obrigatório
      return res.status(400).json({ error: 'Nome é obrigatório' })
    const criado = await Setor.create({ nome }) // <- insere no banco
    res.status(201).json(criado)           // <- 201 Created com objeto criado
  } catch (e) { next(e) }
})

// PUT /api/setores/:id – atualiza um setor (nome)
router.put('/:id', async (req, res, next) => {
  try {
    const { nome } = req.body || {}       // <- extrai nome
    if (!nome)                             // <- valida
      return res.status(400).json({ error: 'Nome é obrigatório' })
    const atualizado = await Setor.update(Number(req.params.id), { nome }) // <- atualiza no banco
    res.json(atualizado)                   // <- devolve setor atualizado
  } catch (e) { next(e) }
})

// DELETE /api/setores/:id – remove um setor
router.delete('/:id', async (req, res, next) => {
  try {
    await Setor.remove(Number(req.params.id)) // <- executa DELETE
    res.status(204).send()                    // <- 204 No Content
  } catch (e) { next(e) }
})

// Exporta o router para montagem no server
module.exports = router
