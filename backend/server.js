// server.js
// Linha 1: carrega variaveis de ambiente (.env)
require('dotenv').config()


// importa libs principais
const express = require('express')
const cors = require('cors')


// importa inicializacao do banco (criando tabelas/seed)
const {initDb} = require('./models/db')