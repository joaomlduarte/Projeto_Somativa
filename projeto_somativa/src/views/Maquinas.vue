<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMaquinasStore } from '../store/maquinas'
import { useSetoresStore } from '../store/setores'
import { useUiStore } from '../store/ui'
import LoadingButton from '../components/LoadingButton.vue'

const maquinas = useMaquinasStore()
const setores  = useSetoresStore()
const ui       = useUiStore()

const abrirForm  = ref(false)
const editandoId = ref(null)
const form       = ref({ nome: '', setorId: '' })
const salvando   = ref(false)
const erro       = ref('')

// filtros opcionais
const filtroSetorId = ref('')

onMounted(async () => {
  await Promise.all([setores.carregar(), maquinas.carregar()])
})

const lista = computed(() => {
  const base = maquinas.lista.map(m => {
    const s = setores.lista.find(x => String(x.id) === String(m.setorId))
    return { ...m, setorNome: s?.nome || '-' }
  })
  if (!filtroSetorId.value) return base
  return base.filter(m => String(m.setorId) === String(filtroSetorId.value))
})

function novo() {
  editandoId.value = null
  form.value = { nome: '', setorId: '' }
  erro.value = ''
  abrirForm.value = true
}

function editar(m) {
  editandoId.value = m.id
  form.value = { nome: m.nome, setorId: m.setorId }
  erro.value = ''
  abrirForm.value = true
}

async function salvar() {
  if (!form.value.nome.trim()) {
    erro.value = 'Informe o nome da máquina.'
    return
  }
  if (!form.value.setorId) {
    erro.value = 'Selecione um setor.'
    return
  }
  try {
    salvando.value = true
    erro.value = ''
    if (editandoId.value) {
      await maquinas.atualizar(editandoId.value, { ...form.value })
      ui.success('Máquina atualizada!')
    } else {
      await maquinas.criar({ ...form.value })
      ui.success('Máquina criada!')
    }
    abrirForm.value = false
  } catch (e) {
    console.error(e)
    ui.error('Não foi possível salvar a máquina.')
    erro.value = 'Não foi possível salvar.'
  } finally {
    salvando.value = false
  }
}

async function excluir(id) {
  if (!confirm('Excluir esta máquina?')) return
  try {
    await maquinas.remover(id)
    ui.success('Máquina excluída!')
  } catch (e) {
    console.error(e)
    ui.error('Falha ao excluir máquina.')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold">Máquinas</h1>
      <LoadingButton @click="novo">Nova máquina</LoadingButton>
    </div>

    <div class="grid sm:grid-cols-3 gap-3 mb-4">
      <div>
        <label class="block text-sm mb-1">Filtrar por setor</label>
        <select v-model="filtroSetorId" class="w-full border rounded px-3 py-2">
          <option value="">Todos</option>
          <option v-for="s in setores.lista" :key="s.id" :value="s.id">{{ s.nome }}</option>
        </select>
      </div>
    </div>

    <div v-if="maquinas.carregando || setores.carregando" class="text-sm text-gray-500">Carregando…</div>
    <div v-else-if="maquinas.erro || setores.erro" class="text-sm text-red-600">
      {{ maquinas.erro || setores.erro }}
    </div>

    <div v-else class="rounded border overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Nome</th>
            <th class="px-3 py-2 text-left">Setor</th>
            <th class="px-3 py-2 w-36"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in lista" :key="m.id" class="border-t">
            <td class="px-3 py-2">{{ m.nome }}</td>
            <td class="px-3 py-2">{{ m.setorNome }}</td>
            <td class="px-3 py-2 text-right">
              <div class="inline-flex gap-2">
                <LoadingButton variant="ghost" @click="editar(m)">Editar</LoadingButton>
                <LoadingButton variant="ghost" @click="excluir(m.id)">Excluir</LoadingButton>
              </div>
            </td>
          </tr>
          <tr v-if="!lista.length">
            <td colspan="3" class="px-3 py-6 text-center text-gray-500">Nenhuma máquina cadastrada.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <transition enter-active-class="transition" leave-active-class="transition"
                enter-from-class="opacity-0" enter-to-class="opacity-100"
                leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="abrirForm" class="fixed inset-0 z-30">
        <div class="absolute inset-0 bg-black/30" @click="abrirForm = false"></div>
        <div class="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl p-4 overflow-auto">
          <h2 class="text-xl font-semibold mb-3">{{ editandoId ? 'Editar máquina' : 'Nova máquina' }}</h2>

          <div class="space-y-3">
            <div>
              <label class="block text-sm mb-1">Nome</label>
              <input v-model="form.nome" class="w-full border rounded px-3 py-2" placeholder="Ex.: Torno CNC" />
            </div>

            <div>
              <label class="block text-sm mb-1">Setor</label>
              <select v-model="form.setorId" class="w-full border rounded px-3 py-2">
                <option value="" disabled>Selecione</option>
                <option v-for="s in setores.lista" :key="s.id" :value="s.id">{{ s.nome }}</option>
              </select>
            </div>

            <p v-if="erro" class="text-sm text-red-600">{{ erro }}</p>

            <div class="flex justify-end gap-2">
              <LoadingButton variant="ghost" @click="abrirForm = false">Cancelar</LoadingButton>
              <LoadingButton :loading="salvando" @click="salvar">Salvar</LoadingButton>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
