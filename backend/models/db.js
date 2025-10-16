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
    return new 
}