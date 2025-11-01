// models/SetorBd.js
// Camada de dados de 'Setor' com Mongoose mantendo a mesma interface.

const { SetorModel, getNextSeq } = require('./db') // importa model e gerador de sequência

// Lista setores (ordenado por nome, como antes)
async function list() {
  // Projeta apenas campos relevantes
  const rows = await SetorModel.find({}, { _id: 0, id: 1, nome: 1 }).sort({ nome: 1 })
  return rows
}

// Busca por id numérico
async function getById(id) {
  return SetorModel.findOne({ id }, { _id: 0, id: 1, nome: 1 })
}

// Cria setor com id incremental
async function create({ nome }) {
  const next = await getNextSeq('setores')
  await SetorModel.create({ id: next, nome })
  return getById(next)
}

// Atualiza setor (somente nome)
async function update(id, { nome }) {
  await SetorModel.updateOne({ id }, { $set: { nome } })
  return getById(id)
}

// Remove setor
async function remove(id) {
  await SetorModel.deleteOne({ id })
  return { ok: true }
}

module.exports = { list, getById, create, update, remove }
