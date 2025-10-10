<!-- src/views/DetalheManutencao.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useManutencoesStore } from '../store/manutencoes'
import { useMaquinasStore } from '../store/maquinas'
import { useSetoresStore } from '../store/setores'

const route = useRoute()
const router = useRouter()

const manutencoes = useManutencoesStore()
const maquinas = useMaquinasStore()
const setores = useSetoresStore()

const id = Number(route.params.id)
const item = ref(null)
const carregando = ref(true)
const erro = ref('')

const statusOptions = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'atrasada', label: 'Atrasada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'hoje', label: 'Hoje' },
]
const labelStatus = v => statusOptions.find(o => o.value === v)?.label || v

onMounted(async () => {
  try {
    await Promise.all([maquinas.carregar(), setores.carregar()])
    item.value = await manutencoes.buscarPorId(id)
  } catch (e) {
    console.error(e)
    erro.value = 'Não foi possível carregar a manutenção.'
  } finally {
    carregando.value = false
  }
})

const maquina = computed(() =>
  maquinas.lista.find(m => m.id === item.value?.maquinaId)
)
const setor = computed(() =>
  maquina.value ? setores.lista.find(s => s.id === maquina.value.setorId) : null
)

async function alterarStatus(novo) {
  if (!item.value) return
  try {
    await manutencoes.mudarStatus(item.value.id, novo)
    item.value.status = novo
    alert('Status atualizado!')
  } catch (e) {
    console.error(e)
    alert('Falha ao atualizar status.')
  }
}

async function concluir() {
  await alterarStatus('concluida')
}

async function atrasarUmDia() {
  if (!item.value) return
  try {
    const d = new Date(item.value.data)
    d.setDate(d.getDate() + 1)
    const dataStr = d.toISOString().slice(0, 10)
    await manutencoes.atualizar(item.value.id, { ...item.value, data: dataStr, status: 'atrasada' })
    item.value.data = dataStr
    item.value.status = 'atrasada'
    alert('Adiada para +1 dia.')
  } catch (e) {
    console.error(e)
    alert('Falha ao adiar.')
  }
}

async function excluir() {
  if (!item.value) return
  if (!confirm('Tem certeza que deseja excluir esta manutenção?')) return
  try {
    await manutencoes.remover(item.value.id)
    router.push('/manutencoes')
  } catch (e) {
    console.error(e)
    alert('Falha ao excluir.')
  }
}
</script>

<template>
  <div>
    <button class="text-sm text-blue-600 hover:underline" @click="$router.back()">← Voltar</button>

    <div class="mt-3 p-4 rounded-2xl bg-white shadow-sm border">
      <template v-if="carregando">Carregando...</template>
      <template v-else-if="erro"><p class="text-red-600">{{ erro }}</p></template>

      <template v-else-if="item">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold">{{ item.titulo }}</h1>
            <p class="text-sm text-gray-500">
              Máquina: <span class="font-medium">{{ maquina?.nome || ('#' + item.maquinaId) }}</span>
              <span class="mx-2">•</span>
              Setor: <span class="font-medium">{{ setor?.nome || '-' }}</span>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <select
              class="border rounded px-3 py-2 text-sm"
              :value="item.status"
              @change="alterarStatus($event.target.value)"
              title="Alterar status"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>

            <button class="px-3 py-2 rounded border hover:bg-gray-50" @click="concluir">Concluir</button>
            <button class="px-3 py-2 rounded border hover:bg-gray-50" @click="atrasarUmDia">+1 dia</button>
            <button class="px-3 py-2 rounded border hover:bg-gray-50 text-red-600" @click="excluir">Excluir</button>
          </div>
        </div>

        <dl class="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div class="p-3 rounded bg-gray-50">
            <dt class="text-gray-500">Status</dt>
            <dd class="font-medium">{{ labelStatus(item.status) }}</dd>
          </div>
          <div class="p-3 rounded bg-gray-50">
            <dt class="text-gray-500">Data</dt>
            <dd class="font-medium">{{ item.data }}</dd>
          </div>
          <div class="p-3 rounded bg-gray-50">
            <dt class="text-gray-500">Máquina</dt>
            <dd class="font-medium">{{ maquina?.nome || ('#' + item.maquinaId) }}</dd>
          </div>
          <div class="p-3 rounded bg-gray-50">
            <dt class="text-gray-500">Setor</dt>
            <dd class="font-medium">{{ setor?.nome || '-' }}</dd>
          </div>
        </dl>
      </template>

      <template v-else>
        <p>Manutenção não encontrada.</p>
      </template>
    </div>
  </div>
</template>
