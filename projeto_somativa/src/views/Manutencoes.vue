<!-- src/views/Manutencoes.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useManutencoesStore } from '../store/manutencoes'
import { useMaquinasStore } from '../store/maquinas'
import { useSetoresStore } from '../store/setores'
import { useRouter } from 'vue-router'

const router = useRouter()
const manutencoes = useManutencoesStore()
const maquinas = useMaquinasStore()
const setores = useSetoresStore()

// carregamento/erro
const carregando = ref(true)
const falhou = ref(false)

onMounted(async () => {
  try {
    await Promise.all([maquinas.carregar(), setores.carregar()])
    await manutencoes.carregar()
  } catch (e) {
    console.error('Falha ao carregar Manutenções:', e)
    falhou.value = true
  } finally {
    carregando.value = false
  }
})

// ---------- opções de status ----------
const statusOptions = [
  { value: '',          label: 'Todos' },
  { value: 'aberta',    label: 'Aberta' },
  { value: 'atrasada',  label: 'Atrasada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'hoje',      label: 'Hoje' },
]
const labelStatus = (v) => statusOptions.find(o => o.value === v)?.label || v

// ---------- filtros ----------
const filtroStatus = ref('')
const filtroSetorId = ref('')
const filtroMaquinaId = ref('')

const maquinasFiltradas = computed(() => {
  if (!filtroSetorId.value) return maquinas.lista
  return maquinas.lista.filter(m => String(m.setorId) === String(filtroSetorId.value))
})

// junta dados p/ exibição
const listaEnriquecida = computed(() => {
  return manutencoes.lista.map(m => {
    const maq = maquinas.lista.find(x => String(x.id) === String(m.maquinaId))
    const setor = maq ? setores.lista.find(s => String(s.id) === String(maq.setorId)) : null
    return {
      ...m,
      maquinaNome: maq?.nome || `#${m.maquinaId}`,
      setorNome: setor?.nome || '-',
      setorId: maq?.setorId ?? null,
    }
  })
})

// aplica filtros
const listaFiltrada = computed(() =>
  listaEnriquecida.value
    .filter(item => {
      const okStatus  = !filtroStatus.value    || item.status === filtroStatus.value
      const okSetor   = !filtroSetorId.value   || String(item.setorId) === String(filtroSetorId.value)
      const okMaquina = !filtroMaquinaId.value || String(item.maquinaId) === String(filtroMaquinaId.value)
      return okStatus && okSetor && okMaquina
    })
    .sort((a, b) => (a.data < b.data ? 1 : -1))
)

// ---------- formulário (criar/editar) ----------
const drawerAberto = ref(false)
const editandoId = ref(null)
const salvando = ref(false)
const form = ref({
  titulo: '',
  data: '',
  status: 'aberta',
  setorId: '',
  maquinaId: '',
})

function abrirCriacao() {
  editandoId.value = null
  form.value = { titulo: '', data: '', status: 'aberta', setorId: '', maquinaId: '' }
  drawerAberto.value = true
}

function abrirEdicao(item) {
  editandoId.value = item.id
  // setorId vem da máquina vinculada
  const maq = maquinas.lista.find(x => String(x.id) === String(item.maquinaId))
  form.value = {
    titulo: item.titulo,
    data: item.data,
    status: item.status,
    setorId: maq?.setorId ?? '',
    maquinaId: item.maquinaId,
  }
  drawerAberto.value = true
}

async function salvar() {
  try {
    salvando.value = true
    const payload = {
      titulo: form.value.titulo,
      data: form.value.data,
      status: form.value.status,
      maquinaId: Number(form.value.maquinaId),
    }
    if (editandoId.value) {
      await manutencoes.atualizar(editandoId.value, payload)
    } else {
      await manutencoes.criar(payload)
    }
    drawerAberto.value = false
  } catch (e) {
    console.error(e)
    alert('Não foi possível salvar.')
  } finally {
    salvando.value = false
  }
}

async function excluir(item) {
  if (!confirm(`Excluir manutenção "${item.titulo}"?`)) return
  try {
    await manutencoes.remover(item.id)
  } catch (e) {
    console.error(e)
    alert('Não foi possível excluir.')
  }
}
</script>

<template>
  <div>
    <div v-if="carregando" class="p-4 text-sm text-gray-500">Carregando…</div>
    <div v-else-if="falhou" class="p-4 text-sm text-red-600">Não foi possível carregar os dados.</div>

    <template v-else>
      <!-- Título + ação -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold">Manutenções</h1>
        <button class="px-3 py-2 rounded bg-blue-600 text-white" @click="abrirCriacao">
          Nova manutenção
        </button>
      </div>

      <!-- Filtros -->
      <div class="grid md:grid-cols-3 gap-3 mb-4">
        <div>
          <label class="block text-sm mb-1">Status</label>
          <select v-model="filtroStatus" class="w-full border rounded px-3 py-2">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm mb-1">Setor</label>
          <select v-model="filtroSetorId" class="w-full border rounded px-3 py-2">
            <option value="">Todos</option>
            <option v-for="s in setores.lista" :key="s.id" :value="s.id">{{ s.nome }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm mb-1">Máquina</label>
          <select v-model="filtroMaquinaId" class="w-full border rounded px-3 py-2">
            <option value="">Todas</option>
            <option v-for="m in maquinasFiltradas" :key="m.id" :value="m.id">{{ m.nome }}</option>
          </select>
        </div>
      </div>

      <!-- Tabela -->
      <div class="rounded border overflow-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Título</th>
              <th class="px-3 py-2 text-left">Máquina</th>
              <th class="px-3 py-2 text-left">Setor</th>
              <th class="px-3 py-2 text-left">Data</th>
              <th class="px-3 py-2 text-left">Status</th>
              <th class="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in listaFiltrada" :key="m.id" class="border-t">
              <td class="px-3 py-2">{{ m.titulo }}</td>
              <td class="px-3 py-2">{{ m.maquinaNome }}</td>
              <td class="px-3 py-2">{{ m.setorNome }}</td>
              <td class="px-3 py-2">{{ m.data }}</td>
              <td class="px-3 py-2">{{ labelStatus(m.status) }}</td>
              <td class="px-3 py-2 text-right flex gap-3 justify-end">
                <RouterLink :to="{ name: 'detalhe', params: { id: m.id } }" class="text-blue-600">Detalhes</RouterLink>
                <button class="text-amber-600 hover:underline" @click="abrirEdicao(m)">Editar</button>
                <button class="text-red-600 hover:underline" @click="excluir(m)">Excluir</button>
              </td>
            </tr>

            <tr v-if="!listaFiltrada.length">
              <td colspan="6" class="px-3 py-6 text-center text-gray-500">Nenhuma manutenção encontrada.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Drawer: criar/editar -->
      <transition
        enter-active-class="transition"
        leave-active-class="transition"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="drawerAberto" class="fixed inset-0 z-30">
          <div class="absolute inset-0 bg-black/30" @click="drawerAberto = false"></div>

          <div class="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl p-4 overflow-auto">
            <h2 class="text-xl font-semibold mb-4">
              {{ editandoId ? 'Editar manutenção' : 'Nova manutenção' }}
            </h2>

            <form class="space-y-3" @submit.prevent="salvar">
              <div>
                <label class="block text-sm mb-1">Título</label>
                <input v-model="form.titulo" class="w-full border rounded px-3 py-2" required />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm mb-1">Data</label>
                  <input type="date" v-model="form.data" class="w-full border rounded px-3 py-2" required />
                </div>

                <div>
                  <label class="block text-sm mb-1">Status</label>
                  <select v-model="form.status" class="w-full border rounded px-3 py-2" required>
                    <option v-for="opt in statusOptions.filter(o => o.value)" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm mb-1">Setor</label>
                  <select v-model="form.setorId" class="w-full border rounded px-3 py-2" required>
                    <option value="" disabled>Selecione</option>
                    <option v-for="s in setores.lista" :key="s.id" :value="s.id">{{ s.nome }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm mb-1">Máquina</label>
                  <select v-model="form.maquinaId" class="w-full border rounded px-3 py-2" required>
                    <option value="" disabled>Selecione</option>
                    <option
                      v-for="m in maquinas.lista.filter(x => !form.setorId || String(x.setorId) === String(form.setorId))"
                      :key="m.id"
                      :value="m.id"
                    >
                      {{ m.nome }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button type="button" class="px-3 py-2 rounded border" @click="drawerAberto = false">Cancelar</button>
                <button type="submit" class="px-3 py-2 rounded bg-blue-600 text-white" :disabled="salvando">
                  {{ salvando ? 'Salvando…' : (editandoId ? 'Salvar alterações' : 'Salvar') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>
