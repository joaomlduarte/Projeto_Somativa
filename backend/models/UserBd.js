// models/UserBd.js
// Autenticação simples via Mongoose (email + password em claro para aula)

const { UserModel } = require('./db')

// Busca usuário por email+senha (retorna sem password)
async function findByEmailPassword(email, password) {
  return UserModel.findOne(
    { email, password },
    { _id: 0, password: 0 } // projeta sem _id e sem password
  ).lean()
}

// Lista todos (debug)
async function list() {
  return UserModel.find({}, { _id: 0, password: 0 }).sort({ id: 1 }).lean()
}

module.exports = { findByEmailPassword, list }
