// server.js
// Linha 1: carrega variaveis de ambiente (.env)
require('dotenv').config()


// importa libs principais
const express = require('express')
const cors = require('cors')


// importa inicializacao do banco (criando tabelas/seed)
const {initDb} = require('./models/db')

// Lê configurações do ambiente
const PORT = Number(process.env.PORT || 4000)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

// Instancia o app Express
const app = express()

// Habilita CORS para o front (vite padr'ao: 5173)
app.use(cors({origin: CORS_ORIGIN}))

// Habilita JSON no corpo das requisicoes
app.use(express.json())

// importa e monta as rotas sob /api
const maquinaRoute = require('./routers/maquinaRoute')
const setoresRoute = require('./routers/setoresRoute')
const manutencoesRoute = require('./routers/manutencoesRoute')
const kpiRoute = require('./routers/kpiRoute')
const authRoute = require('./routers/authRoute')

app.use('/api/maquinas', maquinaRoute)
app.use('/api/setores', setoresRoute)
app.use('/api/manutencoes', manutencoesRoute)
app.use('/api/kpis', kpiRoute)
app.use('/api', authRoute) // Expoe /users (login simples)


// Sobe o servidor apos garantir o DB pronto
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`API rodando em http://localhost:${PORT}`)
    })
}).catch((err) => {
    console.error('Falha ao iniciar DB', err)
    process.exit(1)
})