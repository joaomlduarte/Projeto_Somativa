// ===============================================
// Conexão com MongoDB via Mongoose + definição de
// Schemas/Models + seed inicial + gerador de IDs
// numéricos (collection 'counters').
// ===============================================

// 1) Importa e configura Mongoose
const mongoose = require('mongoose') // ODM para Mongo
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/somativa'

// 2) Opções recomendadas de conexão
const mongooseOpts = {
  autoIndex: true, // Cria índices definidos no schema
}

// 3) Define um schema para contador de sequências (IDs numéricos)
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { collection: 'counters' })

const CounterModel = mongoose.model('Counter', CounterSchema)

// 4) Helper para obter próximo número da sequência
async function getNextSeq(name) {
  // findOneAndUpdate com $inc garante atomicidade
  const ret = await CounterModel.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  return ret.seq
}


// 5) Schemas do domínio (com 'id' numérico e timestamps)
const SetorSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true }, //id incremental
  nome: { type: String, required: true }, //nome do setor
}, { timestamps: { createdAt: 'createdAt', updatedAt, updatedAt: 'updatedAt' }, collection: 'setores' })

const MaquinaSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true }, // id incremental
  nome: { type: String, required: true }, // Nome
  setorId: { type: Number, required: true, index: true }, // referência ao Setor.id (numérico)
  status: { Type: String, default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'maquinas'})


const ManutencaoSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },    // id incremental
  maquinaId: { type: Number, required: true, index: true }, // ref a Maquina.id (numérico)
  tipo: { type: String, enum: ['PREVENTIVA', 'CORRETIVA'], required: true },
  descricao: { type: String, required: true },
  dataAgendada: { type: Date, default: null },
  dataRealizada: { type: Date, default: null },
  status: { type: String, enum: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'], default: 'PENDENTE' },
  prioridade: { type: Number, default: null },        // 1..5
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, collection: 'manutencoes' })

const UserSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true }, // id incremental
  name: { type: String, required: true },
  email: { type: String, required: true, index: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
}, { collection: 'users' })

// 6) compila os Models
const SetorModel = mongoose.model('Setor', SetorSchema)
const MaquinaModel = mongoose.model('Maquina', MaquinaSchema)
const ManutencaoModel = mongoose.model('Manutencao', ManutencaoSchema)
const UserModel = mongoose.model('User', UserSchema)

// 7) Seed inicial (Só roda se estiver vazio)
async function seedIfEmpty() {
  // Usuários
  const usersCount = await UserModel.countDocuments()
  if (usersCount === 0) {
    const id1 = await getNextSeq('users')
    await UserModel.create({ id: id1, name: 'Admin', email: 'admin@smpm.local', password: '123456', role: 'admin' })
    const id2 = await getNextSeq('users')
    await UserModel.create({ id: id2, name: 'Operador', email: 'oper@smpm.local', password: '123456', role: 'user' })
  }

  // Setores + Máquinas + Manutenções
  const setCount = await SetorModel.countDocuments()
  if (setCount === 0) {
    // Setores
    const sid1 = await getNextSeq('setores')
    const sid2 = await getNextSeq('setores')
    const sid3 = await getNextSeq('setores')
    await SetorModel.create({ id: sid1, nome: 'Montagem' })
    await SetorModel.create({ id: sid2, nome: 'Pintura' })
    await SetorModel.create({ id: sid3, nome: 'Usinagem' })

    // Máquinas
    const mid1 = await getNextSeq('maquinas')
    const mid2 = await getNextSeq('maquinas')
    const mid3 = await getNextSeq('maquinas')
    await MaquinaModel.create({ id: mid1, nome: 'Prensa Hidráulica', setorId: sid1, status: 'ATIVA', serie: 'PH-001' })
    await MaquinaModel.create({ id: mid2, nome: 'Esteira XZ', setorId: sid2, status: 'MANUTENCAO', serie: 'EXZ-234'})
    await MaquinaModel.create({ id: mid3, nome: 'Torno CNC', setorId: sid3, status: 'PARADA', serie: 'TC-987' }) 
  }

  // Manutenções
  const now = new Date()
  const man1 = await getNextSeq('Manutencoes')
  await ManutencaoModel.create({
    id: man1, maquinaId: mid1, tipo: 'PREVENTIVA', descricao: 'Troca de óleo e inspeção',
    dataAgendada: now, status: 'PENDENTE', prioridade: 2
  })
  const man2 = await getNextSeq('manutencoes')
  await ManutencaoModel.create({
    id: man2, maquinaId: mid2, tipo: 'CORRETIVA', descricao: 'Substituição de rolamento',
    dataAgendada: new Date(now.getTime() + 86400000), status: 'EM_ANDAMENTO', prioridade: 1
  })
  const man3 = await getNextSeq('manutencoes')
  await ManutencaoModel.create({
    id: man3, maquinaId: mid3, tipo: 'PREVENTIVA', descricao: 'Ajuste e limpeza',
    dataRealizada: new Date(now.getTime() - 2 * 86400000), status : 'CONCLUIDA', prioridade: 3
  })
}

// 8) Função que conecta e roda seed
async function initDb() {
  // Conecta ao mongo (uma vez só)
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(MONGO_URI, mongooseOpts)
  // Garante seed
  await seedIfEmpty()
}

// 9) Exporta tudo o que o resto do backend precisa
module.exports = {
  initDb,
  getNextSeq,
  SetorModel,
  MaquinaModel,
  ManutencaoModel,
  UserModel,
}

