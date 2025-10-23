// models/UserBd.js

// Importa helpers de acesso ao banco
const { get, all } = require('./db') // <- SELECT único e SELECT lista

// Busca usuário por email+senha para login simples
async function findByEmailPassword(email, password) {
  // SELECT somente de campos públicos (sem password)
  return get(
    `SELECT id, name, email, role
       FROM users
      WHERE email = ? AND password = ?`, // <- match exato (aula/demo)
    [email, password]                    // <- parâmetros da query
  )
}

// (Opcional) Lista todos os usuários (útil para debug/inspeção)
async function list() {
  return all(`SELECT id, name, email, role FROM users ORDER BY id ASC`)
}

// Exporta funções ligadas ao domínio de usuário
module.exports = { findByEmailPassword, list }
