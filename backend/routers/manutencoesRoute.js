// routers/manutencoesRoute.js

// Importa o Express e cria um router dedicado às manutenções
const express = require('express')          // <- framework HTTP
const router = express.Router()             // <- agrupador de rotas

// Importa a camada de dados (usa Mongoose por baixo, mas com a mesma interface)
const Man = require('../models/manutencoesBd') // <- list/getById/create/update/patch/remove

// Importa Models puros para consultas auxiliares (nome da máquina no calendário / resolução por nome)
const { ManutencaoModel, MaquinaModel } = require('../models/db') // <- models Mongoose

// -------------------------------------------------------------
// Helpers de normalização / compatibilidade com o front atual
// -------------------------------------------------------------

// Converte status que vem do front (pt-BR) para nosso enum interno
function mapStatus(frontStatus) {
  if (!frontStatus) return undefined                 // se não veio nada, não força
  const s = String(frontStatus).toLowerCase()       // normaliza pra comparar

  if (s.includes('andamento')) return 'EM_ANDAMENTO' // “Em andamento”
  if (s.includes('conclu'))   return 'CONCLUIDA'     // “Concluída”
  // “Agendada”, “Atrasada”, ou qualquer outro vira PENDENTE
  return 'PENDENTE'
}

// Tenta converter datas em vários formatos (ISO ou DD/MM/YYYY)
function parseDateFlexible(value) {
  if (!value) return null
  // Se for objeto Date, devolve direto
  if (value instanceof Date) return value

  const str = String(value)

  // DD/MM/YYYY (pt-BR)
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) {
    const [_, dd, mm, yyyy] = m
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 12) // midday evita timezone edge
    return isNaN(date.getTime()) ? null : date
  }

  // Tenta como ISO/compatível
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

// Resolve o identificador da máquina que veio do front (id, nome, objeto)
async function resolveMaquinaId(body) {
  // 1) Se já veio id explícito em algum formato conhecido
  const idDireto =
    body?.maquinaId ??
    body?.maquina_id ??
    body?.idMaquina ??
    body?.id_maquina ??
    (typeof body?.maquina === 'number' ? body.maquina : undefined)

  if (idDireto !== undefined && idDireto !== null && !isNaN(Number(idDireto))) {
    return Number(idDireto)                         // já temos o id numérico
  }

  // 2) Se veio objeto { id, nome } no campo 'maquina'
  if (body?.maquina && typeof body.maquina === 'object') {
    if (typeof body.maquina.id === 'number') return body.maquina.id
    if (typeof body.maquina.id === 'string' && !isNaN(Number(body.maquina.id))) {
      return Number(body.maquina.id)
    }
    // sem id mas com nome → cai para resolução por nome
    if (typeof body.maquina.nome === 'string') {
      const found = await MaquinaModel.findOne({ nome: body.maquina.nome }).lean()
      return found?.id ?? null
    }
  }

  // 3) Se veio o NOME da máquina como string (ex.: "Prensa Hidráulica")
  const nome =
    (typeof body?.maquina === 'string' && body.maquina) ||
    (typeof body?.maquinaNome === 'string' && body.maquinaNome) ||
    (typeof body?.nomeMaquina === 'string' && body.nomeMaquina)

  if (nome) {
    // Se veio também setor, filtramos por setor para evitar homônimos
    const setorIdRaw =
      body?.setorId ??
      body?.setor_id ??
      (typeof body?.setor === 'number' ? body.setor : undefined)
    const filter = { nome }
    if (setorIdRaw !== undefined && !isNaN(Number(setorIdRaw))) {
      filter.setorId = Number(setorIdRaw)
    }
    const found = await MaquinaModel.findOne(filter, { id: 1 }).lean()
    return found?.id ?? null
  }

  // 4) Não foi possível resolver
  return null
}

// Normaliza todo o corpo da requisição para o formato que nosso model espera
async function normalizePayload(body = {}) {
  // Resolve o id da máquina primeiro (pode depender de consulta por nome)
  const maquinaId = await resolveMaquinaId(body)

  // Mapeia campos de descrição/título que o front pode usar
  const descricao =
    body.descricao ??
    body.description ??
    body.observacao ??
    body.titulo ??
    body.title ??
    null

  // Tipo: como o front não envia, definimos default compatível
  const tipo =
    body.tipo ??
    body.tipoManutencao ??
    'PREVENTIVA'

  // Datas: aceita múltiplos nomes e formatos
  const dataAgendada = parseDateFlexible(
    body.dataAgendada ?? body.data_agendada ?? body.data ?? body.date
  )
  const dataRealizada = parseDateFlexible(
    body.dataRealizada ?? body.data_realizada
  )

  // Status textual → enum interno
  const status = mapStatus(
    body.status ?? body.situacao ?? body.statusManutencao
  )

  // Prioridade opcional
  const prioridade =
    body.prioridade ?? body.priority ?? null

  return {
    maquinaId,
    tipo,
    descricao,
    dataAgendada,
    dataRealizada,
    status,
    prioridade,
  }
}

// -------------------------------------------------------------
// Rotas REST
// -------------------------------------------------------------

// GET /api/manutencoes?status=&maquinaId=&setor=
router.get('/', async (req, res, next) => {
  try {
    const { status, maquinaId, setor } = req.query         // filtros opcionais
    const itens = await Man.list({ status, maquinaId, setor }) // busca no banco
    res.json(itens)                                        // devolve lista
  } catch (e) { next(e) }
})

// GET /api/manutencoes/calendar/events – eventos para calendário
router.get('/calendar/events', async (req, res, next) => {
  try {
    // Carrega todas as manutenções
    const mans = await ManutencaoModel.find().sort({ id: -1 }).lean()

    // Faz join manual pra trazer o nome da máquina
    const maquinaIds = [...new Set(mans.map(m => m.maquinaId))]
    const maquinas = await MaquinaModel.find(
      { id: { $in: maquinaIds } },
      { id: 1, nome: 1, _id: 0 }
    ).lean()
    const mapNome = new Map(maquinas.map(m => [m.id, m.nome]))

    // Mapeia para o formato do componente de calendário
    const events = mans.map(r => {
      const start = r.dataAgendada || r.dataRealizada || r.createdAt
      const end   = r.dataRealizada || r.dataAgendada || r.createdAt
      return {
        id: r.id,
        title: `${r.tipo} - ${mapNome.get(r.maquinaId) || 'Máquina'}`,
        start,
        end,
        status: r.status,
      }
    })

    res.json(events)
  } catch (e) { next(e) }
})

// GET /api/manutencoes/:id – detalhe
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Man.getById(Number(req.params.id))
    if (!item) return res.status(404).json({ error: 'Manutenção não encontrada' })
    res.json(item)
  } catch (e) { next(e) }
})

// POST /api/manutencoes – criação
router.post('/', async (req, res, next) => {
  try {
    // Loga o que chegou para facilitar debug no terminal
    console.log('[POST /api/manutencoes] body recebido:', req.body)

    // Normaliza tudo (id da máquina, datas, status, descrição, etc.)
    const payload = await normalizePayload(req.body)

    // Validação mínima: precisa ter máquina e uma descrição/título
    if (!payload.maquinaId) {
      return res.status(400).json({
        error: 'Informe a máquina (id, objeto com {id}, ou nome existente).',
        dica:  'Se só tiver o nome, selecione a máquina na UI; eu resolvo por nome e setor.',
      })
    }
    if (!payload.descricao) {
      return res.status(400).json({
        error: 'Informe uma descrição ou título para a manutenção.',
        dica:  'O campo "Título" do formulário já vale como descrição.',
      })
    }

    // Cria de fato a manutenção (camada de dados fará os ajustes finais)
    const criado = await Man.create(payload)
    res.status(201).json(criado)            // 201 Created com o objeto criado
  } catch (e) { next(e) }
})

// PUT /api/manutencoes/:id – atualização “completa” (merge interno)
router.put('/:id', async (req, res, next) => {
  try {
    console.log('[PUT /api/manutencoes/:id] body recebido:', req.body)

    const payload = await normalizePayload(req.body)
    const atualizado = await Man.update(Number(req.params.id), payload)
    res.json(atualizado)
  } catch (e) { next(e) }
})

// PATCH /api/manutencoes/:id – atualização parcial (status/data rápida)
router.patch('/:id', async (req, res, next) => {
  try {
    console.log('[PATCH /api/manutencoes/:id] body recebido:', req.body)

    // Para PATCH, geralmente só vem status e/ou data
    const status = mapStatus(req.body.status)
    const data   = parseDateFlexible(req.body.data || req.body.dataAgendada || req.body.data_agendada)

    const updated = await Man.patch(Number(req.params.id), { status, data })
    res.json(updated)
  } catch (e) { next(e) }
})

// DELETE /api/manutencoes/:id – remoção
router.delete('/:id', async (req, res, next) => {
  try {
    await Man.remove(Number(req.params.id))
    res.status(204).send()
  } catch (e) { next(e) }
})

// Exporta o router para o server.js montar em /api/manutencoes
module.exports = router
