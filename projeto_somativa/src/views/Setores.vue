<script setup>
import { ref, onMounted } from 'vue'
import { useSetoresStore } from '../store/setores'
import { useUiStore } from '../store/ui'
import LoadingButton from '../components/LoadingButton.vue'

const setores = useSetoresStore()
const ui = useUiStore()

const abrirForm   = ref(false)
const editandoId  = ref(null)
const form        = ref({ nome: '' })
const salvando    = ref(false)
const erro        = ref('')

onMounted(() => setores.carregar())

function novo() {
  editandoId.value = null
  form.value = { nome: '' }
  erro.value = ''
  abrirForm.value = true
}

function editar(s) {
  editandoId.value = s.id
  form.value = { nome: s.nome }
  erro.value = ''
  abrirForm.value = true
}

async function salvar() {
  if (!form.value.nome.trim()) {
    erro.value = 'Informe o nome do setor.'
    return
  }
  try {
    salvando.value = true
    erro.value = ''
    if (editandoId.value) {
      await setores.atualizar(editandoId.value, { ...form.value })
      ui.success('Setor atualizado!')
    } else {
      await setores.criar({ ...form.value })
      ui.success('Setor criado!')
    }
    abrirForm.value = false
  } catch (e) {
    console.error(e)
    ui.error('Não foi possível salvar o setor.')
    erro.value = 'Não foi possível salvar.'
  } finally {
    salvando.value = false
  }
}

async function excluir(id) {
  if (!confirm('Excluir este setor?')) return
  try {
    await setores.remover(id)
    ui.success('Setor excluído!')
  } catch (e) {
    console.error(e)
    ui.error('Falha ao excluir setor.')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold">Setores</h1>
      <LoadingButton @click="novo">Novo setor</LoadingButton>
    </div>

    <div v-if="setores.carregando" class="text-sm text-gray-500">Carregando…</div>
    <div v-else-if="setores.erro" class="text-sm text-red-600">{{ setores.erro }}</div>

    <div v-else class="rounded border overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Nome</th>
            <th class="px-3 py-2 w-36"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in setores.lista" :key="s.id" class="border-t">
            <td class="px-3 py-2">{{ s.nome }}</td>
            <td class="px-3 py-2 text-right">
              <div class="inline-flex gap-2">
                <LoadingButton variant="ghost" @click="editar(s)">Editar</LoadingButton>
                <LoadingButton variant="ghost" @click="excluir(s.id)">Excluir</LoadingButton>
              </div>
            </td>
          </tr>
          <tr v-if="!setores.lista.length">
            <td colspan="2" class="px-3 py-6 text-center text-gray-500">Nenhum setor cadastrado.</td>
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
        <div class="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-4 overflow-auto">
          <h2 class="text-xl font-semibold mb-3">{{ editandoId ? 'Editar setor' : 'Novo setor' }}</h2>

          <div class="space-y-3">
            <div>
              <label class="block text-sm mb-1">Nome</label>
              <input v-model="form.nome" class="w-full border rounded px-3 py-2" placeholder="Ex.: Produção" />
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
