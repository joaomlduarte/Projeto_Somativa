// models/manutencoesBd.js
// Mongoose mantendo interface/shape compatíveis com o front.

const { ManutencaoModel, MaquinaModel, getNextSeq } = require('./db')

// Normaliza o objeto para o front (idem versão SQLite)
function normalize(doc) {
  if (!doc) return null
  const data = doc.dataAgendada || doc.dataRealizada || doc.createdAt
  return {
    id: doc.id,
    maquinaId: doc.maquinaId,
    tipo: doc.tipo,
    descricao: doc.descricao,
    dataAgendada: doc.dataAgendada,
    dataRealizada: doc.dataRealizada,
    data,
    status: doc.status,
    prioridade: doc.prioridade ?? null,
    createdAt: doc.createdAt,
  }
}

// Lista com filtros: status, maquinaId, setor (por setorId da máquina)
async function list({ status, maquinaId, setor } = {}) {
  const q = {}
  if (status) q.status = status
  if (maquinaId) q.maquinaId = Number(maquinaId)

  // Filtro por setor exige olhar máquinas -> pega ids de máquinas do setor
  if (setor) {
    const mids = await MaquinaModel.find(
      { setorId: Number(setor) },
      { id: 1, _id: 0 }
    ).lean()
    q.maquinaId = { $in: mids.map(m => m.id) }
  }

  const rows = await ManutencaoModel.find(q).sort({ id: -1 }).lean()
  return rows.map(normalize)
}

// Busca por id
async function getById(id) {
  const row = await ManutencaoModel.findOne({ id }).lean()
  return normalize(row)
}

// Cria manutenção
async function create(payload) {
  const next = await getNextSeq('manutencoes')
  const doc = {
    id: next,
    maquinaId: Number(payload.maquinaId),
    tipo: payload.tipo,
    descricao: payload.descricao,
    dataAgendada: payload.dataAgendada ? new Date(payload.dataAgendada) : null,
    dataRealizada: payload.dataRealizada ? new Date(payload.dataRealizada) : null,
    status: payload.status || 'PENDENTE',
    prioridade: payload.prioridade ?? null,
  }
  await ManutencaoModel.create(doc)
  return getById(next)
}

// Atualiza (PUT) com merge simples
async function update(id, payload) {
  const cur = await ManutencaoModel.findOne({ id })
  if (!cur) throw new Error('Manutenção não encontrada')

  if (payload.maquinaId !== undefined) cur.maquinaId = Number(payload.maquinaId)
  if (payload.tipo !== undefined) cur.tipo = payload.tipo
  if (payload.descricao !== undefined) cur.descricao = payload.descricao
  if (payload.dataAgendada !== undefined) cur.dataAgendada = payload.dataAgendada ? new Date(payload.dataAgendada) : null
  if (payload.dataRealizada !== undefined) cur.dataRealizada = payload.dataRealizada ? new Date(payload.dataRealizada) : null
  if (payload.status !== undefined) cur.status = payload.status
  if (payload.prioridade !== undefined) cur.prioridade = payload.prioridade

  await cur.save()
  return getById(id)
}

// Patch (status/data rápida)
async function patch(id, payload) {
  const cur = await ManutencaoModel.findOne({ id })
  if (!cur) throw new Error('Manutenção não encontrada')

  if (payload.status) cur.status = payload.status
  if (payload.data) cur.dataAgendada = payload.data ? new Date(payload.data) : null

  await cur.save()
  return getById(id)
}

// Remove
async function remove(id) {
  await ManutencaoModel.deleteOne({ id })
  return { ok: true }
}

module.exports = { list, getById, create, update, patch, remove }
