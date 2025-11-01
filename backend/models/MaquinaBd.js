// models/MaquinaBd.js
// Migração para Mongo: mantém as funções e shape do objeto que o front espera.

const { MaquinaModel, SetorModel, getNextSeq } = require('./db')

// Auxiliar: combina máquina + setor (nome) no mesmo objeto
function withSetor(m, setorNome) {
  return {
    id: m.id,
    nome: m.nome,
    setorId: m.setorId,
    status: m.status,
    serie: m.serie ?? null,
    createdAt: m.createdAt,
    setor: setorNome ? { id: m.setorId, nome: setorNome } : undefined,
  }
}

// Lista máquinas, opcionalmente filtrando por setorId
async function list({ setorId } = {}) {
  const filter = {}
  if (setorId) filter.setorId = Number(setorId)

  // Busca máquinas
  const maquinas = await MaquinaModel.find(filter).sort({ id: 1 }).lean()

  // Busca nomes de setores usados em uma tacada só (evita N+1)
  const setorIds = [...new Set(maquinas.map(m => m.setorId))]
  const setores = await SetorModel.find({ id: { $in: setorIds } }, { id: 1, nome: 1, _id: 0 }).lean()
  const mapSetores = new Map(setores.map(s => [s.id, s.nome]))

  return maquinas.map(m => withSetor(m, mapSetores.get(m.setorId)))
}

// Busca uma máquina por id (com setor)
async function getById(id) {
  const m = await MaquinaModel.findOne({ id }).lean()
  if (!m) return null
  const setor = await SetorModel.findOne({ id: m.setorId }, { nome: 1, _id: 0 }).lean()
  return withSetor(m, setor?.nome)
}

// Cria máquina com id incremental
async function create({ nome, setorId, status = 'ATIVA', serie = null }) {
  const next = await getNextSeq('maquinas')
  await MaquinaModel.create({ id: next, nome, setorId: Number(setorId), status, serie })
  return getById(next)
}

// Atualiza máquina (merge parcial)
async function update(id, payload) {
  const m = await MaquinaModel.findOne({ id })
  if (!m) throw new Error('Máquina não encontrada')

  if (payload.nome !== undefined) m.nome = payload.nome
  if (payload.setorId !== undefined) m.setorId = Number(payload.setorId)
  if (payload.status !== undefined) m.status = payload.status
  if (payload.serie !== undefined) m.serie = payload.serie

  await m.save()
  return getById(id)
}

// Remove máquina
async function remove(id) {
  await MaquinaModel.deleteOne({ id })
  return { ok: true }
}

module.exports = { list, getById, create, update, remove }
