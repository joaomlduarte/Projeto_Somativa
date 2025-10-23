// models/authBd.js

// Reaproveita a função de busca de usuário do módulo UserBd
const { findByEmailPassword } = require('./UserBd') // <- separa responsabilidades

// “Serviço” de login, layer para evoluir depois (ex.: JWT)
async function login(email, password) {
  // Aqui apenas delegamos ao repositório e devolvemos o usuário (sem senha)
  return findByEmailPassword(email, password)
}

// Exporta o serviço de autenticação
module.exports = { login }
