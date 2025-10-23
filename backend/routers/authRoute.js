// routers/authRoute.js

// Importa Express e cria router
const express = require('express')      // <- framework web
const router = express.Router()         // <- instância de roteador

// Importa serviço de autenticação e lista de usuários (debug)
const { login } = require('../models/authBd')   // <- lógica de login
const { list } = require('../models/UserBd')    // <- utilitário para listar (opcional)

// Implementa exatamente o que o seu front chama:
// GET /api/users?email=...&password=...
router.get('/users', async (req, res, next) => {
  try {
    const { email, password } = req.query || {}       // <- lê credenciais da querystring
    if (!email || !password) return res.json([])      // <- se faltar, retorna array vazio (comportamento simples)
    const user = await login(email, password)         // <- tenta autenticar
    if (!user) return res.json([])                    // <- não achou? devolve array vazio
    res.json([user])                                  // <- achou: devolve em array (o front espera lista)
  } catch (e) { next(e) }                             // <- encaminha erros
})

// (Opcional) GET /api/_users – lista usuários (debug/inspeção)
router.get('/_users', async (req, res, next) => {
  try {
    res.json(await list())                            // <- retorna todos (sem senha)
  } catch (e) { next(e) }
})

// Exporta router
module.exports = router
