// models/manutencoesBd.js
// =======================================================
// Camada de dados de Manutenções usando Mongoose,
// mantendo a mesma interface usada pelo front.
// Agora respondemos também a chave `titulo` como
// alias de `descricao`, para compatibilizar com a UI.
// =======================================================

const { ManutencaoModel, MaquinaModel, getNextSeq } = require('./db') // importa Models e gerador de sequência

// -------------------------------------------------------
// Normalizador: transforma o documento do Mongo no shape
// que o front espera. Aqui criamos o alias `titulo`.
// -------------------------------------------------------
function normalize(doc) {
  if (!doc) return null                                // segurança: se não vier nada, retorna null

  // `data` é usada pelo front como fallback (exibição simples)
  const data = doc.dataAgendada || doc.dataRealizada || doc.createdAt

  return {
    id: doc.id,                                        // id numérico incremental
    maquinaId: doc.maquinaId,                          // id da máquina (numérico)
    tipo: doc.tipo,                                    // PREVENTIVA | CORRETIVA
    descricao: doc.descricao,                          // texto descritivo
    titulo: doc.descricao,                             // ✅ alias para a UI que usa `titulo`
    dataAgendada: doc.dataAgendada,                    // Date ou null
    dataRealizada: doc.dataRealizada,                  // Date ou null
    data,                                              // fallback de data
    status: doc.status,                                // PENDENTE | EM_ANDAMENTO | CONCLUIDA
    prioridade: doc.prioridade ?? null,                // 1..5 ou null
    createdAt: doc.createdAt,                          // timestamp de criação
  }
}

// -------------------------------------------------------
// Lista com filtros opcionais: status, maquinaId, setor
// -------------------------------------------------------
async function list({ status, maquinaId, setor } = {}) {
  const q = {}
  if (status) q.status = status                        // filtra por status se veio
  if (maquinaId) q.maquinaId = Number(maquinaId)       // filtra por máquina se veio

  // se filtrar por setor, primeiro buscamos máquinas desse setor e usamos seus ids
  if (setor) {
    const mids = await MaquinaModel.find(
      { setorId: Number(setor) },
      { id: 1, _id: 0 }
    ).lean()

    q.maquinaId = { $in: mids.map(m => m.id) }         // restringe às máquinas do setor
  }

  const rows = await ManutencaoModel.find(q).sort({ id: -1 }).lean() // busca e ordena decrescente por id
  return rows.map(normalize)                            // normaliza cada item
}

// -------------------------------------------------------
// Busca detalhe por id
// -------------------------------------------------------
async function getById(id) {
  const row = await ManutencaoModel.findOne({ id }).lean()
  return normalize(row)
}

// -------------------------------------------------------
// Cria manutenção
//  - `payload` já vem normalizado pelo router (id, datas, status)
// -------------------------------------------------------
async function create(payload) {
  const next = await getNextSeq('manutencoes')         // gera próximo id numérico
  const doc = {
    id: next,
    maquinaId: Number(payload.maquinaId),
    tipo: payload.tipo,                                 // default já aplicado no router
    descricao: payload.descricao,                       // título/descrição
    dataAgendada: payload.dataAgendada || null,         // Date ou null
    dataRealizada: payload.dataRealizada || null,       // Date ou null
    status: payload.status || 'PENDENTE',               // enum garantido no router
    prioridade: payload.prioridade ?? null,
  }

  await ManutencaoModel.create(doc)                     // insere no Mongo
  return getById(next)                                  // retorna já normalizado
}

// -------------------------------------------------------
// Atualiza (PUT) com merge controlado
// -------------------------------------------------------
async function update(id, payload) {
  const cur = await ManutencaoModel.findOne({ id })     // busca doc atual
  if (!cur) throw new Error('Manutenção não encontrada')

  // aplica apenas campos presentes no payload
  if (payload.maquinaId !== undefined) cur.maquinaId = Number(payload.maquinaId)
  if (payload.tipo !== undefined) cur.tipo = payload.tipo
  if (payload.descricao !== undefined) cur.descricao = payload.descricao
  if (payload.dataAgendada !== undefined) cur.dataAgendada = payload.dataAgendada || null
  if (payload.dataRealizada !== undefined) cur.dataRealizada = payload.dataRealizada || null
  if (payload.status !== undefined) cur.status = payload.status
  if (payload.prioridade !== undefined) cur.prioridade = payload.prioridade ?? null

  await cur.save()                                      // persiste
  return getById(id)                                    // devolve normalizado
}

// -------------------------------------------------------
// Atualização parcial (PATCH) — status e/ou data rápida
// -------------------------------------------------------
async function patch(id, payload) {
  const cur = await ManutencaoModel.findOne({ id })
  if (!cur) throw new Error('Manutenção não encontrada')

  if (payload.status !== undefined && payload.status) cur.status = payload.status
  if (payload.data !== undefined) cur.dataAgendada = payload.data || null

  await cur.save()
  return getById(id)
}

// -------------------------------------------------------
// Remoção
// -------------------------------------------------------
async function remove(id) {
  await ManutencaoModel.deleteOne({ id })
  return { ok: true }
}

module.exports = { list, getById, create, update, patch, remove }
