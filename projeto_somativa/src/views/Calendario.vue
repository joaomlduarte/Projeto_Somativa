<script setup>
// Vue
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// Stores
import { useManutencoesStore } from '../store/manutencoes'
import { useMaquinasStore } from '../store/maquinas'
import { useSetoresStore } from '../store/setores'

const router = useRouter()

// ===================== Stores + carregamento =====================
const manutencoes = useManutencoesStore()
const maquinas     = useMaquinasStore()
const setores      = useSetoresStore()

const carregando = ref(true)
const falhou     = ref(false)

onMounted(async () => {
  try {
    await Promise.all([maquinas.carregar(), setores.carregar()])
    await manutencoes.carregar()
  } catch (e) {
    console.error('Falha ao carregar calendário', e)
    falhou.value = true
  } finally {
    carregando.value = false
  }
})

// ===================== util de data =====================
function pad(n) { return String(n).padStart(2, '0') }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }

const hoje = new Date()
const hojeStr = ymd(hoje)

// mês atual (ano/mes controlado)
const ano = ref(hoje.getFullYear())
const mes = ref(hoje.getMonth()) // 0..11

function irHoje() {
  ano.value = hoje.getFullYear()
  mes.value = hoje.getMonth()
}
function proxMes() {
  if (mes.value === 11) { mes.value = 0; ano.value++ } else { mes.value++ }
}
function antMes() {
  if (mes.value === 0) { mes.value = 11; ano.value-- } else { mes.value-- }
}

const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const nomeMesAtual = computed(() => `${nomesMes[mes.value]} de ${ano.value}`)

// ===================== gera a grade 6x7 =====================
const grade = computed(() => {
  const first = new Date(ano.value, mes.value, 1)
  const last  = new Date(ano.value, mes.value + 1, 0)
  const firstWeekday = (first.getDay() + 6) % 7 // segunda=0 ... domingo=6

  const start = new Date(first)
  start.setDate(first.getDate() - firstWeekday)

  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const y = ymd(d)
    const items = manutencoes.lista.filter(m => m.data === y)
    cells.push({
      date: d,
      inMonth: d.getMonth() === mes.value,
      ymd: y,
      items,
    })
  }
  return cells
})

// ===================== cores / labels de status =====================
const statusLabels = {
  aberta: 'Aberta',
  atrasada: 'Atrasada',
  concluida: 'Concluída',
  hoje: 'Hoje'
}
const statusPill = {
  aberta:    'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200',
  atrasada:  'bg-red-100 text-red-800 ring-1 ring-red-200',
  hoje:      'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  concluida: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
}

// ===================== painel lateral (dia selecionado) =====================
const abrirPainel     = ref(false)
const diaSelecionado  = ref(null) // célula da grade
const salvando        = ref(false)
const erroCriacao     = ref('')

// form do painel (defaults mudam ao abrirDia)
const form = ref({
  titulo: '',
  setorId: '',
  maquinaId: '',
  status: 'aberta', // default; ajustamos para "hoje" quando for o dia atual
})

// máquinas filtradas pelo setor escolhido
const maquinasFiltradas = computed(() => {
  if (!form.value.setorId) return maquinas.lista
  return maquinas.lista.filter(m => String(m.setorId) === String(form.value.setorId))
})

function resetFormParaDia(cell) {
  const isHoje = cell?.ymd === hojeStr
  form.value = {
    titulo: '',
    setorId: '',
    maquinaId: '',
    status: isHoje ? 'hoje' : 'aberta',
  }
  erroCriacao.value = ''
}

function abrirDia(cell) {
  diaSelecionado.value = cell
  resetFormParaDia(cell)
  abrirPainel.value = true
}

// Lista enriquecida para o painel
const itensDoDia = computed(() => {
  const cell = diaSelecionado.value
  if (!cell) return []
  return cell.items.map(m => {
    const maq   = maquinas.lista.find(x => String(x.id) === String(m.maquinaId))
    const setor = maq ? setores.lista.find(s => String(s.id) === String(maq.setorId)) : null
    return {
      ...m,
      maquinaNome: maq?.nome || `#${m.maquinaId}`,
      setorNome: setor?.nome || '-'
    }
  }).sort((a,b) => a.titulo.localeCompare(b.titulo))
})

// fecha painel se trocar mês/ano e o dia sumir da grade
watch([ano, mes], () => {
  if (!abrirPainel.value || !diaSelecionado.value) return
  const stillThere = grade.value.find(c => c.ymd === diaSelecionado.value.ymd)
  if (!stillThere) abrirPainel.value = false
})

// ===================== helpers de contagem por status =====================
function contarPorStatus(items) {
  return items.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1
    return acc
  }, {})
}

// navegação
function irDetalhe(id) {
  router.push({ name: 'detalhe', params: { id } })
}

// ===================== criar manutenção no dia =====================
async function criarNoDia() {
  if (!diaSelecionado.value) return

  // validações simples
  if (!form.value.titulo?.trim()) {
    erroCriacao.value = 'Informe um título.'
    return
  }
  if (!form.value.maquinaId) {
    erroCriacao.value = 'Selecione uma máquina.'
    return
  }

  try {
    erroCriacao.value = ''
    salvando.value = true

    await manutencoes.criar({
      titulo: form.value.titulo.trim(),
      data: diaSelecionado.value.ymd,
      status: form.value.status,                 // 'hoje' | 'aberta' | 'atrasada' | 'concluida'
      maquinaId: Number(form.value.maquinaId)
    })

    await manutencoes.carregar()

    // atualiza a célula atual (recalcular grade força tudo, mas listagem já reflete via store)
    const cell = grade.value.find(c => c.ymd === diaSelecionado.value.ymd)
    if (cell) diaSelecionado.value = cell // re-referenciar para reactivity do painel

    resetFormParaDia(diaSelecionado.value)
  } catch (e) {
    console.error(e)
    erroCriacao.value = 'Não foi possível criar a manutenção.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="carregando" class="p-4 text-sm text-gray-500">Carregando…</div>
    <div v-else-if="falhou" class="p-4 text-sm text-red-600">Não foi possível carregar os dados.</div>

    <template v-else>
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold">Calendário</h1>
        <div class="flex items-center gap-2">
          <button class="px-3 py-2 rounded border" @click="antMes">← Anterior</button>
          <div class="min-w-[180px] text-center font-medium">{{ nomeMesAtual }}</div>
          <button class="px-3 py-2 rounded border" @click="proxMes">Próximo →</button>
          <button class="px-3 py-2 rounded border ml-2" @click="irHoje">Hoje</button>
        </div>
      </div>

      <!-- Legenda -->
      <div class="flex flex-wrap gap-3 mb-3 text-xs">
        <span class="inline-flex items-center gap-2">
          <span class="h-2 w-2 rounded bg-yellow-400"></span> Aberta
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="h-2 w-2 rounded bg-red-500"></span> Atrasada
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="h-2 w-2 rounded bg-blue-500"></span> Hoje
        </span>
        <span class="inline-flex items-center gap-2">
          <span class="h-2 w-2 rounded bg-emerald-500"></span> Concluída
        </span>
      </div>

      <!-- Grade 7x6 -->
      <div class="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div class="grid grid-cols-7 text-xs text-gray-500 border-b">
          <div class="p-2 text-center">Seg</div><div class="p-2 text-center">Ter</div>
          <div class="p-2 text-center">Qua</div><div class="p-2 text-center">Qui</div>
          <div class="p-2 text-center">Sex</div><div class="p-2 text-center">Sáb</div>
          <div class="p-2 text-center">Dom</div>
        </div>

        <div class="grid grid-cols-7">
          <button
            v-for="cell in grade"
            :key="cell.ymd"
            class="h-28 p-2 border -ml-px -mt-px text-left relative focus:outline-none hover:bg-gray-50"
            :class="cell.inMonth ? 'bg-white' : 'bg-gray-50/60 text-gray-400'"
            @click="abrirDia(cell)"
          >
            <div class="text-xs font-medium">
              {{ cell.date.getDate() }}
            </div>

            <div class="absolute bottom-2 left-2 right-2 space-y-1">
              <template v-if="cell.items.length">
                <div class="flex items-center gap-1">
                  <div
                    v-for="(qtd, status) in contarPorStatus(cell.items)"
                    :key="status"
                    class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                    :class="{
                      'bg-yellow-200 text-yellow-900': status === 'aberta',
                      'bg-red-200 text-red-900':     status === 'atrasada',
                      'bg-blue-200 text-blue-900':   status === 'hoje',
                      'bg-emerald-200 text-emerald-900': status === 'concluida',
                    }"
                  >
                    <span class="capitalize">{{ statusLabels[status] || status }}</span>
                    <span class="font-semibold">{{ qtd }}</span>
                  </div>
                </div>
              </template>
            </div>
          </button>
        </div>
      </div>

      <!-- Painel lateral -->
      <transition
        enter-active-class="transition"
        leave-active-class="transition"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="abrirPainel" class="fixed inset-0 z-30">
          <div class="absolute inset-0 bg-black/30" @click="abrirPainel = false"></div>

          <div class="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-2xl p-4 overflow-auto">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xl font-semibold">
                {{ diaSelecionado?.date.toLocaleDateString('pt-BR') }}
              </h2>
              <button class="px-2 py-1 rounded border" @click="abrirPainel = false">Fechar</button>
            </div>

            <!-- Lista do dia -->
            <div class="mb-6">
              <div v-if="!itensDoDia.length" class="text-sm text-gray-500">
                Nenhuma manutenção para este dia.
              </div>
              <ul v-else class="space-y-2">
                <li v-for="m in itensDoDia" :key="m.id" class="rounded border p-3">
                  <div class="flex items-center justify-between">
                    <div class="font-medium">{{ m.titulo }}</div>
                    <span class="text-[11px] px-2 py-0.5 rounded ring-1"
                          :class="statusPill[m.status]">
                      {{ statusLabels[m.status] || m.status }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ m.maquinaNome }} • {{ m.setorNome }}
                  </div>
                  <div class="mt-2 flex items-center justify-end">
                    <button class="px-2 py-1 rounded border text-xs" @click="irDetalhe(m.id)">
                      Detalhes
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Criar manutenção neste dia -->
            <div class="rounded-2xl border p-4">
              <h3 class="font-semibold mb-3">Criar manutenção para este dia</h3>

              <div class="grid sm:grid-cols-2 gap-3">
                <div class="sm:col-span-2">
                  <label class="block text-sm mb-1">Título</label>
                  <input
                    v-model="form.titulo"
                    class="w-full border rounded px-3 py-2"
                    placeholder="Ex.: Troca de óleo"
                  />
                </div>

                <div>
                  <label class="block text-sm mb-1">Setor</label>
                  <select v-model="form.setorId" class="w-full border rounded px-3 py-2">
                    <option value="">Todos</option>
                    <option v-for="s in setores.lista" :key="s.id" :value="s.id">{{ s.nome }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm mb-1">Máquina</label>
                  <select v-model="form.maquinaId" class="w-full border rounded px-3 py-2">
                    <option value="" disabled>Selecione</option>
                    <option v-for="m in maquinasFiltradas" :key="m.id" :value="m.id">{{ m.nome }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm mb-1">Status</label>
                  <select v-model="form.status" class="w-full border rounded px-3 py-2">
                    <option value="hoje">Hoje</option>
                    <option value="aberta">Aberta</option>
                    <option value="atrasada">Atrasada</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>

                <div class="sm:col-span-2 flex items-center justify-end gap-2">
                  <span v-if="erroCriacao" class="text-sm text-red-600 mr-auto">{{ erroCriacao }}</span>
                  <button type="button" class="px-3 py-2 rounded border" @click="resetFormParaDia(diaSelecionado)">
                    Limpar
                  </button>
                  <button
                    type="button"
                    class="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                    :disabled="salvando"
                    @click="criarNoDia"
                  >
                    {{ salvando ? 'Salvando…' : 'Criar' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>

<style scoped>
.grid > button:first-child { border-left-width: 0px; }
.grid > button:nth-child(7n + 1) { border-left-width: 0px; }
</style>
