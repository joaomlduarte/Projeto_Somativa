// models/MaquinaBd.js

// Importa helpers do SQLite: all (SELECT muitos), get (SELECT 1) e run (INSERT/UPDATE/DELETE)
const { all, get, run } = require('./db') // <- centraliza acesso ao banco

// Função auxiliar que “enriquece” a linha da máquina com dados do setor
function withSetor(row) {                       // <- recebe uma linha crua vinda do SELECT
  if (!row) return null                         // <- se não existir, retorna null
  return {                                      // <- monta um objeto pronto para o front
    id: row.id,                                 // <- id da máquina
    nome: row.nome,                             // <- nome da máquina
    setorId: row.setor_id,                      // <- id do setor (FK)
    status: row.status,                         // <- status da máquina (ATIVA|PARADA|MANUTENCAO)
    serie: row.serie,                           // <- número de série (pode ser null)
    createdAt: row.created_at,                  // <- data de criação (audit trail)
    setor: row.setor_nome                       // <- se o SELECT incluiu o nome do setor...
      ? { id: row.setor_id, nome: row.setor_nome } // <- ...retorna objeto setor com id e nome
      : undefined                               // <- senão, deixa undefined
  }
}

// Lista máquinas com filtro opcional por setor
async function list({ setorId } = {}) {         // <- recebe um objeto com possível filtro setorId
  const params = []                              // <- array com parâmetros para o SQL
  let where = ''                                 // <- trecho WHERE dinâmico (vazio inicialmente)

  if (setorId) {                                 // <- se veio setorId na query...
    where = 'WHERE m.setor_id = ?'               // <- adiciona WHERE por setor
    params.push(Number(setorId))                 // <- adiciona o valor convertido para número
  }

  // SELECT com JOIN em setores para trazer o nome do setor (setor_nome)
  const rows = await all(                        // <- executa SELECT que retorna várias linhas
    `SELECT m.*, s.nome AS setor_nome
       FROM maquinas m
       JOIN setores s ON s.id = m.setor_id
       ${where}
       ORDER BY m.id ASC`,                       // <- ordena por id crescente
    params                                       // <- parâmetros para o WHERE (se houver)
  )

  return rows.map(withSetor)                     // <- mapeia cada linha usando a função auxiliar
}

// Busca uma máquina específica por id (com setor)
async function getById(id) {                     // <- recebe id numérico
  const row = await get(                         // <- SELECT que retorna uma única linha
    `SELECT m.*, s.nome AS setor_nome
       FROM maquinas m
       JOIN setores s ON s.id = m.setor_id
      WHERE m.id = ?`,                           // <- filtra pelo id da máquina
    [id]                                         // <- parâmetro para o placeholder ?
  )
  return withSetor(row)                          // <- normaliza e devolve no formato esperado
}

// Cria uma nova máquina
async function create({ nome, setorId, status = 'ATIVA', serie = null }) {
  // INSERT da máquina com nome, setor, status e série
  const { lastID } = await run(                  // <- executa INSERT; retorna id gerado
    `INSERT INTO maquinas (nome, setor_id, status, serie)
     VALUES (?, ?, ?, ?)`,
    [nome, Number(setorId), status, serie]       // <- parâmetros nas interrogações
  )
  return getById(lastID)                         // <- busca o registro recém-criado já “expandido”
}

// Atualiza uma máquina (aceita atualização parcial)
async function update(id, payload) {             // <- id da máquina + objeto de campos a alterar
  const current = await getById(id)              // <- busca o estado atual para mesclar parciais
  if (!current) throw new Error('Máquina não encontrada') // <- valida existência

  // Mescla valores: se vier no payload usa, senão mantém o atual
  const nome = payload.nome ?? current.nome
  const setorId = payload.setorId != null ? Number(payload.setorId) : current.setorId
  const status = payload.status ?? current.status
  const serie = payload.serie ?? current.serie

  // Executa o UPDATE com os valores finais
  await run(
    `UPDATE maquinas SET nome = ?, setor_id = ?, status = ?, serie = ? WHERE id = ?`,
    [nome, setorId, status, serie, id]
  )

  return getById(id)                             // <- devolve a máquina atualizada no formato expandido
}

// Remove uma máquina por id
async function remove(id) {
  await run(`DELETE FROM maquinas WHERE id = ?`, [id]) // <- executa DELETE
  return { ok: true }                                  // <- resposta simples para confirmar sucesso
}

// Exporta as funções do “repositório” de máquinas
module.exports = { list, getById, create, update, remove }
