<!-- src/views/Dashboard.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Stores (sua pasta é "store", singular)
import { useKpisStore } from '../store/kpis'
import { useManutencoesStore } from '../store/manutencoes'
import { useMaquinasStore } from '../store/maquinas'
import { useSetoresStore } from '../store/setores'

// Gráficos existentes
import ChartDonut from '@/components/charts/ChartDonut.vue'
import ChartBars from '@/components/charts/ChartBars.vue'

// Gráficos novos (KeepUp)
import ChartLine from '@/components/charts/ChartLine.vue'
import ChartStackBars from '@/components/charts/ChartStackBars.vue'

const router = useRouter()
const kpis = useKpisStore()
const manutencoes = useManutencoesStore()
const maquinas = useMaquinasStore()
const setores = useSetoresStore()

const carregando = ref(true)
const falhou = ref(false)

// Carregar dados iniciais
onMounted(async () => {
  try {
    await Promise.all([
      setores.carregar?.() ?? Promise.resolve(),
      maquinas.carregar?.() ?? Promise.resolve(),
      manutencoes.carregar?.() ?? Promise.resolve(),
    ])
    await kpis.carregar()
  } catch (e) {
    console.error(e)
    falhou.value = true
  } finally {
    carregando.value = false
  }
})

/* ------------------ Criar manutenção “hoje” ------------------ */
const hojeStr = new Date().toISOString().slice(0, 10)
const criarHojeForm = ref({ titulo: '', setorId: '', maquinaId: '', status: 'hoje', data: hojeStr })
const salvandoHoje = ref(false)

const maquinasDoSetor = computed(() => {
  if (!criarHojeForm.value.setorId) return []
  return maquinas.lista.filter(m => String(m.setorId) === String(criarHojeForm.value.setorId))
})

async function criarParaHoje () {
  if (!criarHojeForm.value.titulo || !criarHojeForm.value.maquinaId) {
    alert('Preencha Título e Máquina.')
    return
  }
  salvandoHoje.value = true
  try {
    await manutencoes.criar({
      titulo: criarHojeForm.value.titulo,
      maquinaId: Number(criarHojeForm.value.maquinaId),
      status: 'hoje',
      data: hojeStr,
    })
    await Promise.all([manutencoes.carregar(), kpis.carregar()])
    criarHojeForm.value = { titulo: '', setorId: '', maquinaId: '', status: 'hoje', data: hojeStr }
  } catch (e) {
    console.error(e)
    alert('Falha ao criar manutenção.')
  } finally {
    salvandoHoje.value = false
  }
}

/* ------------------ Próximas manutenções ------------------ */
const proximas = computed(() => {
  const enr = (manutencoes.lista || []).map(m => {
    const maq = maquinas.lista.find(x => x.id === m.maquinaId)
    const set = maq ? setores.lista.find(s => s.id === maq.setorId) : null
    return { ...m, maquinaNome: maq?.nome || `#${m.maquinaId}`, setorNome: set?.nome || '-' }
  })
  return [...enr].sort((a, b) => (a.data > b.data ? 1 : -1)).slice(0, 5)
})
async function alterarStatusRapido (id, novo) {
  try {
    await manutencoes.mudarStatus(id, novo)
    await Promise.all([manutencoes.carregar(), kpis.carregar()])
  } catch (e) {
    console.error(e)
    alert('Não foi possível alterar o status.')
  }
}

/* ------------------ Classes e labels de status ------------------ */
const statusList = ['aberta', 'atrasada', 'concluida', 'hoje']
const statusOptions = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'atrasada', label: 'Atrasada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'hoje', label: 'Hoje' },
]
const labelStatus = (s) => ({
  aberta: 'Aberta',
  atrasada: 'Atrasada',
  concluida: 'Concluída',
  hoje: 'Hoje',
}[s] || s)
const clsStatus = (s) => ({
  aberta: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  atrasada: 'bg-red-50 text-red-800 border border-red-200',
  concluida: 'bg-green-50 text-green-800 border border-green-200',
  hoje: 'bg-blue-50 text-blue-800 border border-blue-200',
}[s] || 'bg-gray-50 text-gray-800 border border-gray-200')

/* ------------------ Distribuições (barras CSS simples) ------------------ */
const distPorStatus = computed(() => {
  const base = { aberta: 0, atrasada: 0, concluida: 0, hoje: 0 }
  for (const m of (manutencoes.lista || [])) {
    if (base[m.status] !== undefined) base[m.status]++
  }
  const total = Object.values(base).reduce((a, b) => a + b, 0) || 1
  return statusList.map(s => ({ key: s, value: base[s], pct: Math.round((base[s] / total) * 100) }))
})
const distPorSetor = computed(() => {
  const counts = {}
  for (const m of (manutencoes.lista || [])) {
    const maq = maquinas.lista.find(x => x.id === m.maquinaId)
    const set = maq ? setores.lista.find(s => s.id === maq.setorId) : null
    const nome = set?.nome || '—'
    counts[nome] = (counts[nome] || 0) + 1
  }
  const arr = Object.entries(counts).map(([nome, qtd]) => ({ nome, qtd }))
  const total = arr.reduce((a, b) => a + b.qtd, 0) || 1
  return arr.map(x => ({ ...x, pct: Math.round((x.qtd / total) * 100) })).sort((a,b)=>b.qtd-a.qtd).slice(0,5)
})

/* ------------------ Widgets existentes ------------------ */
// 1) Donut - taxa de conclusão
const taxaConclusao = computed(() => {
  const total = (manutencoes.lista || []).length
  if (!total) return 0
  const concluidas = (manutencoes.lista || []).filter(m => m.status === 'concluida').length
  return concluidas / total
})

// 2) Tendência últimos 30 dias por data (campo m.data) — gráfico de barras simples
function gerarSerieUltimosNDias(n = 30) {
  const hoje = new Date()
  const dias = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${day}`
    dias.push(iso)
  }
  return dias
}
const ultimos30 = computed(() => gerarSerieUltimosNDias(30))
const seriePorDia = computed(() => {
  const mapa = Object.fromEntries(ultimos30.value.map(d => [d, 0]))
  for (const m of (manutencoes.lista || [])) {
    const data = String(m.data || '').slice(0, 10)
    if (mapa[data] !== undefined) mapa[data] += 1
  }
  return ultimos30.value.map(d => mapa[d])
})
const labelsCompact = computed(() =>
  ultimos30.value.map((d, i) => (i % 5 === 0 ? d.slice(5).replace('-', '/') : ''))
)

/* ------------------ ADIÇÕES: Filtros + séries novas (KeepUp) ------------------ */
// Filtros (período/status/setor)
const range = ref(30)           // 7 | 14 | 30
const statusFiltro = ref('')    // '', 'aberta','hoje','atrasada','concluida'
const setorFiltro = ref('')     // id do setor

function daysBack(n) {
  const arr = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
    arr.push(`${y}-${m}-${day}`)
  }
  return arr
}
const diasDash = computed(() => daysBack(range.value))
const labelsDash = computed(() =>
  diasDash.value.map((d, i) => (i % (range.value === 7 ? 1 : 5) === 0 ? d.slice(5).replace('-', '/') : ''))
)

const listaFiltradaDash = computed(() => {
  let base = (manutencoes.lista || [])
  if (statusFiltro.value) base = base.filter(m => m.status === statusFiltro.value)
  if (setorFiltro.value) {
    base = base.filter(m => {
      const maq = maquinas.lista.find(x => x.id === m.maquinaId)
      return maq && String(maq.setorId) === String(setorFiltro.value)
    })
  }
  return base
})

// Série 1: Produtividade (concluídas/dia) no período selecionado
const serieConcluidas = computed(() => {
  const mapa = Object.fromEntries(diasDash.value.map(d => [d, 0]))
  for (const m of listaFiltradaDash.value) {
    if (m.status === 'concluida') {
      const dd = String(m.data || '').slice(0,10)
      if (dd in mapa) mapa[dd]++
    }
  }
  return diasDash.value.map(d => mapa[d])
})

// Série 2: Backlog empilhado (aberta/hoje/atrasada) por dia
const stackSeries = computed(() => {
  const base = {
    aberta:   Object.fromEntries(diasDash.value.map(d => [d, 0])),
    hoje:     Object.fromEntries(diasDash.value.map(d => [d, 0])),
    atrasada: Object.fromEntries(diasDash.value.map(d => [d, 0])),
  }
  for (const m of listaFiltradaDash.value) {
    const dd = String(m.data || '').slice(0,10)
    if (!(dd in base.aberta)) continue
    if (m.status === 'aberta')   base.aberta[dd]++
    if (m.status === 'hoje')     base.hoje[dd]++
    if (m.status === 'atrasada') base.atrasada[dd]++
  }
  return {
    aberta: diasDash.value.map(d => base.aberta[d]),
    hoje: diasDash.value.map(d => base.hoje[d]),
    atrasada: diasDash.value.map(d => base.atrasada[d]),
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-4">
      <h1 class="text-xl font-semibold">Dashboard</h1>
      <p class="text-sm text-gray-500">Visão geral das manutenções e indicadores</p>
    </div>

    <!-- Estados globais -->
    <div v-if="carregando" class="rounded-2xl bg-white border p-6 text-gray-600">Carregando dados…</div>
    <div v-else-if="falhou" class="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700">
      Não foi possível carregar os dados. Tente novamente.
    </div>

    <template v-else>
      <!-- KPIs (tema KeepUp) -->
      <div class="grid md:grid-cols-4 gap-3 mb-4">
        <div class="rounded-2xl bg-white shadow-sm border-l-4 border-yellow-400 p-4">
          <div class="text-sm text-gray-500 mb-1">Abertas</div>
          <div class="text-2xl font-semibold text-yellow-600">{{ kpis.dados?.abertas ?? 0 }}</div>
          <div class="mt-2 text-xs text-gray-400">Atualizado pelo servidor</div>
        </div>
        <div class="rounded-2xl bg-white shadow-sm border-l-4 border-red-500 p-4">
          <div class="text-sm text-gray-500 mb-1">Atrasadas</div>
          <div class="text-2xl font-semibold text-red-600">{{ kpis.dados?.atrasadas ?? 0 }}</div>
          <div class="mt-2 text-xs text-gray-400">Atualizado pelo servidor</div>
        </div>
        <div class="rounded-2xl bg-white shadow-sm border-l-4 border-blue-500 p-4">
          <div class="text-sm text-gray-500 mb-1">Para hoje</div>
          <div class="text-2xl font-semibold text-blue-600">{{ kpis.dados?.hoje ?? 0 }}</div>
          <div class="mt-2 text-xs text-gray-400">Atualizado pelo servidor</div>
        </div>
        <div class="rounded-2xl bg-white shadow-sm border-l-4 border-green-500 p-4">
          <div class="text-sm text-gray-500 mb-1">Concluídas no mês</div>
          <div class="text-2xl font-semibold text-green-600">{{ kpis.dados?.concluidasMes ?? 0 }}</div>
          <div class="mt-2 text-xs text-gray-400">Atualizado pelo servidor</div>
        </div>
      </div>

      <!-- Criar hoje -->
      <div class="rounded-2xl bg-white shadow-sm border p-4 mb-4">
        <div class="font-medium mb-3">Criar manutenção para hoje</div>
        <div class="grid md:grid-cols-12 gap-3 items-end">
          <div class="md:col-span-5">
            <label class="block text-sm mb-1">Título</label>
            <input v-model="criarHojeForm.titulo" type="text" class="w-full border rounded-xl px-3 py-2" placeholder="Ex.: Troca de óleo" />
          </div>

          <div class="md:col-span-3">
            <label class="block text-sm mb-1">Setor</label>
            <select v-model="criarHojeForm.setorId" class="w-full border rounded-xl px-3 py-2">
              <option value="">Selecione…</option>
              <option v-for="s in setores.lista" :key="s.id" :value="s.id">{{ s.nome }}</option>
            </select>
          </div>

          <div class="md:col-span-3">
            <label class="block text-sm mb-1">Máquina</label>
            <select v-model="criarHojeForm.maquinaId" class="w-full border rounded-xl px-3 py-2" :disabled="!criarHojeForm.setorId">
              <option value="">Selecione…</option>
              <option v-for="m in maquinasDoSetor" :key="m.id" :value="m.id">{{ m.nome }}</option>
            </select>
          </div>

          <div class="md:col-span-1">
            <button
              class="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 disabled:opacity-50"
              :disabled="salvandoHoje || !criarHojeForm.titulo || !criarHojeForm.maquinaId"
              @click="criarParaHoje"
            >
              {{ salvandoHoje ? 'Salvando…' : 'Criar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Próximas + Distribuições -->
      <div class="grid lg:grid-cols-2 gap-4">
        <!-- Próximas -->
        <div class="rounded-2xl bg-white shadow-sm border">
          <div class="flex items-center justify-between p-4 border-b">
            <div class="font-medium">Próximas manutenções</div>
            <button class="text-sm text-blue-600" @click="router.push({ name: 'manutencoes' })">Ver todas</button>
          </div>
          <ul class="divide-y">
            <li v-for="m in proximas" :key="m.id" class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-medium">{{ m.titulo }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ m.data }} • {{ m.maquinaNome }} • {{ m.setorNome }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="clsStatus(m.status)">
                    {{ labelStatus(m.status) }}
                  </span>
                  <select class="border rounded px-2 py-1 text-xs" :value="m.status" @change="alterarStatusRapido(m.id, $event.target.value)" title="Alterar status">
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                  <button class="text-xs text-blue-600" @click="router.push({ name: 'detalhe', params: { id: m.id } })">
                    Detalhes
                  </button>
                </div>
              </div>
            </li>
            <li v-if="!proximas.length" class="p-4 text-sm text-gray-500">Sem próximas manutenções.</li>
          </ul>
        </div>

        <!-- Distribuições -->
        <div class="rounded-2xl bg-white shadow-sm border">
          <div class="p-4 border-b font-medium">Distribuições</div>
          <div class="grid sm:grid-cols-2 gap-4 p-4">
            <!-- Por Status -->
            <div>
              <div class="text-sm text-gray-600 mb-2">Por status</div>
              <ul class="space-y-2">
                <li v-for="row in distPorStatus" :key="row.key">
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span>{{ labelStatus(row.key) }}</span>
                    <span>{{ row.value }} ({{ row.pct }}%)</span>
                  </div>
                  <div class="h-2 rounded bg-gray-100">
                    <div class="h-2 rounded bg-gray-800" :style="{ width: row.pct + '%' }"></div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Por Setor -->
            <div>
              <div class="text-sm text-gray-600 mb-2">Top setores</div>
              <ul class="space-y-2">
                <li v-for="row in distPorSetor" :key="row.nome">
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span>{{ row.nome }}</span>
                    <span>{{ row.qtd }} ({{ row.pct }}%)</span>
                  </div>
                  <div class="h-2 rounded bg-gray-100">
                    <div class="h-2 rounded bg-gray-800" :style="{ width: row.pct + '%' }"></div>
                  </div>
                </li>
                <li v-if="!distPorSetor.length" class="text-xs text-gray-500">Sem dados.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== FILTROS DA DASHBOARD (ADIÇÃO) ====== -->
      <div class="rounded-2xl bg-white shadow-sm border p-4 mt-4">
        <div class="flex flex-wrap gap-2 items-center">
          <div class="text-sm text-gray-600 mr-2">Período:</div>
          <button class="px-3 py-1.5 rounded-xl border" :class="range===7 ? 'bg-gray-800 text-white' : 'bg-white'"
                  @click="range=7">7 dias</button>
          <button class="px-3 py-1.5 rounded-xl border" :class="range===14 ? 'bg-gray-800 text-white' : 'bg-white'"
                  @click="range=14">14 dias</button>
          <button class="px-3 py-1.5 rounded-xl border" :class="range===30 ? 'bg-gray-800 text-white' : 'bg-white'"
                  @click="range=30">30 dias</button>

          <div class="w-px h-6 bg-gray-200 mx-2"></div>

          <label class="text-sm text-gray-600">Status:</label>
          <select v-model="statusFiltro" class="border rounded-xl px-2 py-1.5 text-sm">
            <option value="">Todos</option>
            <option value="aberta">Aberta</option>
            <option value="hoje">Hoje</option>
            <option value="atrasada">Atrasada</option>
            <option value="concluida">Concluída</option>
          </select>

          <label class="text-sm text-gray-600 ml-2">Setor:</label>
          <select v-model="setorFiltro" class="border rounded-xl px-2 py-1.5 text-sm">
            <option value="">Todos</option>
            <option v-for="s in setores.lista" :key="s.id" :value="s.id">{{ s.nome }}</option>
          </select>
        </div>
      </div>

      <!-- ====== GRÁFICOS NOVOS (KeepUp) ====== -->
      <div class="grid lg:grid-cols-2 gap-4 mt-4">
        <!-- Linha: concluidas/dia -->
        <div class="rounded-2xl bg-white shadow-sm border">
          <div class="flex items-center justify-between p-4 border-b">
            <div class="font-medium">Produtividade (concluídas/dia)</div>
            <div class="text-xs text-gray-500">Últimos {{ range }} dias</div>
          </div>
          <div class="p-4">
            <ChartLine :values="serieConcluidas" :labels="labelsDash" :labelEvery="range===7?1:5"/>
          </div>
        </div>

        <!-- Empilhado: backlog por dia -->
        <div class="rounded-2xl bg-white shadow-sm border">
          <div class="flex items-center justify-between p-4 border-b">
            <div class="font-medium">Backlog por status</div>
            <div class="text-xs text-gray-500">Abertas + Hoje + Atrasadas</div>
          </div>
          <div class="p-4">
            <ChartStackBars :series="stackSeries" :labels="labelsDash" :labelEvery="range===7?1:5"/>
          </div>
        </div>
      </div>

      <!-- ===== WIDGETS ANTERIORES ===== -->
      <div class="grid lg:grid-cols-2 gap-4 mt-4">
        <!-- Donut taxa de conclusão -->
        <div class="rounded-2xl bg-white shadow-sm border">
          <div class="flex items-center justify-between p-4 border-b">
            <div class="font-medium">Taxa de conclusão</div>
            <div class="text-xs text-gray-500">Concluídas ÷ Total</div>
          </div>
          <div class="p-4 grid grid-cols-2 gap-4 items-center">
            <ChartDonut :value="taxaConclusao" :size="180" :thickness="18" />
            <div class="text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Total:</span>
                <span class="font-medium">{{ (manutencoes.lista || []).length }}</span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-gray-500">Concluídas:</span>
                <span class="font-medium">{{ (manutencoes.lista || []).filter(m => m.status==='concluida').length }}</span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-gray-500">Abertas:</span>
                <span class="font-medium">{{ (manutencoes.lista || []).filter(m => ['aberta','hoje','atrasada'].includes(m.status)).length }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-3">
                Atualiza automaticamente com as manutenções.
              </p>
            </div>
          </div>
        </div>

        <!-- Tendência últimos 30 dias (barras simples) -->
        <div class="rounded-2xl bg-white shadow-sm border">
          <div class="flex items-center justify-between p-4 border-b">
            <div class="font-medium">Tendência – últimos 30 dias</div>
            <div class="text-xs text-gray-500">Contagem por dia (campo <code>data</code>)</div>
          </div>
          <div class="p-4">
            <ChartBars :values="seriePorDia" :labels="labelsCompact" />
            <div class="mt-3 text-xs text-gray-500">
              Dica: edite o <code>db.json</code> para simular datas e ver a curva mudar.
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
