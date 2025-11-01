// models/authBd.js
const { findByEmailPassword } = require('./UserBd')

async function login(email, password) {
  return findByEmailPassword(email, password)
}

module.exports = { login }
