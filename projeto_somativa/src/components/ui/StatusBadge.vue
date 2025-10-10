<script setup>
// Props: status 'aberta' | 'atrasada' | 'concluida' | 'hoje' | 'em-andamento'
const props = defineProps({
  status: { type: String, required: true }
})

const labels = {
  aberta: 'Aberta',
  atrasada: 'Atrasada',
  concluida: 'Concluída',
  'em-andamento': 'Em andamento',
  hoje: 'Hoje',
}

const cls = {
  aberta:         'bg-blue-100 text-blue-800',
  atrasada:       'bg-red-100 text-red-800',
  concluida:      'bg-emerald-100 text-emerald-800',
  'em-andamento': 'bg-purple-100 text-purple-800',
  hoje:           'bg-amber-100 text-amber-800',
}

const text = labels[props.status] ?? props.status
const klass = cls[props.status] ?? 'bg-gray-100 text-gray-700'
</script>

<template>
  <span class="px-2 py-1 rounded text-xs font-medium" :class="klass">
    {{ text }}
  </span>
</template>
