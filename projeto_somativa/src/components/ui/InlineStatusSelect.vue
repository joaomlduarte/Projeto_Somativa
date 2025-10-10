<script setup>
import { ref, watch } from 'vue'
import { useManutencoesStore } from '../../store/manutencoes'

const props = defineProps({
  modelValue: { type: String, required: true },
  manutencaoId: { type: [Number, String], required: true },
})

const emit = defineEmits(['update:modelValue'])
const store = useManutencoesStore()

const value = ref(props.modelValue)
watch(() => props.modelValue, v => { value.value = v })

const options = [
  { value: 'aberta',    label: 'Aberta' },
  { value: 'atrasada',  label: 'Atrasada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'hoje',      label: 'Hoje' },
]

async function onChange(e) {
  const novo = e.target.value
  value.value = novo
  emit('update:modelValue', novo)
  try {
    await store.mudarStatus(props.manutencaoId, novo)
  } catch (err) {
    console.error(err)
    // rollback em caso de falha
    const antigo = props.modelValue
    value.value = antigo
    emit('update:modelValue', antigo)
    alert('Não foi possível alterar o status.')
  }
}
</script>

<template>
  <select
    class="text-xs px-2 py-1 rounded border bg-white"
    :value="value"
    @change="onChange"
  >
    <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
  </select>
</template>
