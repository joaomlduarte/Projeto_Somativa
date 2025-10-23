// models/manutencoesBd.js

// Importa helpers do SQLite: all/get/run
const { all, get, run } = require('./db') // <- abstrações promisificadas de sqlite3

// Normaliza uma linha de manutenção para o formato que o front espera
function normalize(row) {                                          // <- recebe linha do banco
  if (!row) return null                                            // <- se não houver, retorna null
  const data = row.data_agendada || row.data_realizada || row.created_at // <- define campo 'data'
  return {                                                         // <- objeto já pronto p/ front
    id: row.id,                                                    // <- id da manutenção
    maquinaId: row.maquina_id,                                     // <- FK da máquina
    tipo: row.tipo,                                                // <- PREVENTIVA | CORRETIVA
    descricao: row.descricao,                                      // <- texto descritivo
    dataAgendada: row.data_agendada,                               // <- agendamento (ISO ou null)
    dataRealizada: row.data_realizada,                             // <- quando finalizou (ISO/null)
    data,                                                          // <- usado para calendário/ordenação
    status: row.status,                                            // <- PENDENTE | EM_ANDAMENTO | CONCLUIDA
    prioridade: row.prioridade,                                    // <- 1..5 (ou null)
    createdAt: row.created_at                                      // <- data de criação
  }
}

// Lista manutenções com filtros opcionais (status, maquinaId, setor)
async function list({ status, maquinaId, setor } = {}) {
  const params = []                                                // <- coletor de parâmetros
  const conds = []                                                 // <- condições dinâmicas do WHERE

  if (status) { conds.push('m.status = ?'); params.push(status) }  // <- filtra por status (se vier)
  if (maquinaId) { conds.push('m.maquina_id = ?'); params.push(Number(maquinaId)) } // <- por máquina
  if (setor) { conds.push('mq.setor_id = ?'); params.push(Number(setor)) } // <- filtra por setor (via join)

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '' // <- monta WHERE final

  // Faz JOIN com máquinas para viabilizar o filtro por setor
  const rows = await all(
    `SELECT m.*
       FROM manutencoes m
       JOIN maquinas mq ON mq.id = m.maquina_id
       ${where}
       ORDER BY m.id DESC`,                                        // <- mais recentes primeiro
    params                                                          // <- array de parâmetros
  )

  return rows.map(normalize)                                       // <- normaliza cada linha
}

// Busca uma manutenção por id
async function getById(id) {
  const row = await get(`SELECT * FROM manutencoes WHERE id = ?`, [id]) // <- SELECT 1
  return normalize(row)                                                  // <- normaliza ou null
}

// Cria uma manutenção nova
async function create(payload) {
  // Desestrutura com defaults para campos opcionais
  const {
    maquinaId,
    tipo,
    descricao,
    dataAgendada = null,
    dataRealizada = null,
    status = 'PENDENTE',
    prioridade = null
  } = payload

  // Executa INSERT com todos os campos relevantes
  const { lastID } = await run(
    `INSERT INTO manutencoes
     (maquina_id, tipo, descricao, data_agendada, data_realizada, status, prioridade)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [Number(maquinaId), tipo, descricao, dataAgendada, dataRealizada, status, prioridade]
  )

  return getById(lastID)                                           // <- retorna a manutenção criada
}

// Atualiza (PUT) – substitui campos (com merge dos ausentes)
async function update(id, payload) {
  const cur = await getById(id)                                    // <- busca atual
  if (!cur) throw new Error('Manutenção não encontrada')           // <- valida existência

  // Decide novos valores: se vier no payload usa, senão mantém atual
  const maquinaId = payload.maquinaId != null ? Number(payload.maquinaId) : cur.maquinaId
  const tipo = payload.tipo ?? cur.tipo
  const descricao = payload.descricao ?? cur.descricao
  const dataAgendada = payload.dataAgendada ?? cur.dataAgendada
  const dataRealizada = payload.dataRealizada ?? cur.dataRealizada
  const status = payload.status ?? cur.status
  const prioridade = payload.prioridade ?? cur.prioridade

  // Aplica o UPDATE com os valores decididos
  await run(
    `UPDATE manutencoes
        SET maquina_id = ?, tipo = ?, descricao = ?,
            data_agendada = ?, data_realizada = ?,
            status = ?, prioridade = ?
      WHERE id = ?`,
    [maquinaId, tipo, descricao, dataAgendada, dataRealizada, status, prioridade, id]
  )

  return getById(id)                                               // <- retorna atualizado normalizado
}

// Patch (parcial) – usado para mudar status ou reagendar data rapidamente
async function patch(id, payload) {
  const cur = await getById(id)                                    // <- busca atual
  if (!cur) throw new Error('Manutenção não encontrada')           // <- valida existência

  const next = { ...cur }                                          // <- cria cópia para alteração in-memory
  if (payload.status) next.status = payload.status                 // <- se veio novo status, troca
  if (payload.data) next.dataAgendada = payload.data               // <- se veio nova data (data), usa no agendamento

  // Atualiza somente os campos necessários (status e/ou data_agendada)
  await run(
    `UPDATE manutencoes
        SET data_agendada = ?, status = ?
      WHERE id = ?`,
    [next.dataAgendada, next.status, id]
  )

  return getById(id)                                               // <- devolve versão final
}

// Remove uma manutenção por id
async function remove(id) {
  await run(`DELETE FROM manutencoes WHERE id = ?`, [id])          // <- executa DELETE
  return { ok: true }                                              // <- resposta simples de sucesso
}

// Exporta o “repositório” de manutenções
module.exports = { list, getById, create, update, patch, remove }
