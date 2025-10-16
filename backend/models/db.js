// importa sqlite3 e utilitarios de FS
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

// Le caminho do arquivo do banco a partir do .env
const DB_FILE = process.env.DB_FILE || './data/dev.db'
const DB_DIR = path.dirname(DB_FILE)
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, {recursive: true})


// abre/instancia a conexao com o sqlite
const db = new sqlite3.Database(DB_FILE)

// Helpers promisificados (run/get/all)
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err)
            resolve({lastID: this.lastID, changes: this.changes})
        })
    })
}
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err)
            resolve(row)
        })
    })
}
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err)
            resolve(rows)
        })
    })
}

// Criacao de tabelas
async function createTables() {
    // cria tabelas se nao existem
    await run(`
        CREATE TABLE IF NOT EXISTS setores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
           )
        `)

    await run(`
        CREATE TABLE IF NOT EXISTS maquinas(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            setor_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'ATIVA',
            serie TEXT,
            create_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (setor_id) REFERENCES setores(id)
            )
        `)

    await run(`
        CREATE TABLE IF NOT EXISTS manutencoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            maquina_id INTEGER NOT NULL,
            tipo TEXT NOT NULL, -- PREVENTIVA | CORRETIVA
            descricao TEXT NOT NULL,
            data_agendada DATETIME,
            data_realizada DATETIME,
            status TEXT NOT NULL DEFAULT 'PENDENTE', -- PENDENTE | EM_ANDAMENTO | CONCLUIDA
            prioridade INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (maquina_id) REFERENCES maquinas(id)
           )
        `)

    await run(`
        CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
       )
    `)
}


// Seed inicial para testes
async function seedIfEmpty() {
    // insere 2 usuarios de teste se a tabela estiver vazia
    const u = await get(`SELECT COUNT(*) as n FROM users`)
    if (u.n === 0) {
        await run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, ['Admin', 'admin@smpm.local', '123456', 'admin'])
        await run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, ['Operador', 'oper@smpm.local', '123456', 'user'])
    }

    //setores/maquinas/manutenções iniciais
  const s = await get(`SELECT COUNT(*) as n FROM setores`)
  if (s.n === 0) {
    const { lastID: s1 } = await run(`INSERT INTO setores (nome) VALUES (?)`, ['Montagem'])
    const { lastID: s2 } = await run(`INSERT INTO setores (nome) VALUES (?)`, ['Pintura'])
    const { lastID: s3 } = await run(`INSERT INTO setores (nome) VALUES (?)`, ['Usinagem'])

    const { lastID: m1 } = await run(
      `INSERT INTO maquinas (nome, setor_id, status, serie) VALUES (?, ?, ?, ?)`,
      ['Prensa Hidráulica', s1, 'ATIVA', 'PH-001']
    )
    const { lastID: m2 } = await run(
      `INSERT INTO maquinas (nome, setor_id, status, serie) VALUES (?, ?, ?, ?)`,
      ['Esteira XZ', s2, 'MANUTENCAO', 'EXZ-234']
    )
    const { lastID: m3 } = await run(
      `INSERT INTO maquinas (nome, setor_id, status, serie) VALUES (?, ?, ?, ?)`,
      ['Torno CNC', s3, 'PARADA', 'TC-987']
    )

    // hoje
    await run(
      `INSERT INTO manutencoes (maquina_id, tipo, descricao, data_agendada, status, prioridade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m1, 'PREVENTIVA', 'Troca de óleo e inspeção', new Date().toISOString(), 'PENDENTE', 2]
    )
    // amanhã
    await run(
      `INSERT INTO manutencoes (maquina_id, tipo, descricao, data_agendada, status, prioridade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m2, 'CORRETIVA', 'Substituição de rolamento', new Date(Date.now() + 86400000).toISOString(), 'EM_ANDAMENTO', 1]
    )
    // -2 dias (concluída)
    await run(
      `INSERT INTO manutencoes (maquina_id, tipo, descricao, data_realizada, status, prioridade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m3, 'PREVENTIVA', 'Ajuste e limpeza', new Date(Date.now() - 2 * 86400000).toISOString(), 'CONCLUIDA', 3]
    )
  }
}

//  Inicialização geral
async function initDb() {
  await createTables()
  await seedIfEmpty()
}

module.exports = { db, run, get, all, initDb }
