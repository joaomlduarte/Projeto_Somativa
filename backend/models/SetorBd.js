// models/SetorBd.js
const { all, get, run } = require('./db')

// Lista todos os setores (ordenados por nome)
async function list() {
  return all(`SELECT id, nome FROM setores ORDER BY nome ASC`)
}

// Busca setor por id
async function getById(id) {
  return get(`SELECT id, nome FROM setores WHERE id = ?`, [id])
}

// Cria setor
async function create({ nome }) {
  const { lastID } = await run(`INSERT INTO setores (nome) VALUES (?)`, [nome])
  return getById(lastID)
}

// Atualiza setor
async function update(id, { nome }) {
  await run(`UPDATE setores SET nome = ? WHERE id = ?`, [nome, id])
  return getById(id)
}

// Remove setor
async function remove(id) {
  await run(`DELETE FROM setores WHERE id = ?`, [id])
  return { ok: true }
}

module.exports = { list, getById, create, update, remove }
