<template>
  <div class="w-full">
    <div class="flex items-end gap-1 h-44 w-full border-b pb-1">
      <div
        v-for="(col, idx) in stacked"
        :key="idx"
        class="flex-1 flex flex-col-reverse rounded overflow-hidden"
        :title="tooltip(idx)"
      >
        <div
          v-for="seg in col"
          :key="seg.key"
          class="w-full rounded-t-sm"
          :class="seg.class"
          :style="{ height: seg.h + '%' }"
        />
      </div>
    </div>
    <div class="flex justify-between text-[10px] text-gray-500 mt-1">
      <span v-for="(l,i) in labels" :key="i">{{ showLabel(i) ? l : '' }}</span>
    </div>

    <div class="flex gap-4 mt-2 text-xs">
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-2 bg-yellow-400 rounded"></span> Abertas
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-2 bg-blue-400 rounded"></span> Hoje
      </div>
      <div class="flex items-center gap-1">
        <span class="inline-block w-3 h-2 bg-red-500 rounded"></span> Atrasadas
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Ex.: { aberta:[...], hoje:[...], atrasada:[...] }
  series: { type: Object, required: true },
  labels: { type: Array, required: true },
  labelEvery: { type: Number, default: 5 },
})

const keys = ['aberta','hoje','atrasada']
const classes = {
  aberta: 'bg-yellow-400',
  hoje: 'bg-blue-400',
  atrasada: 'bg-red-500',
}

const totals = computed(() => {
  const len = props.labels.length
  const arr = new Array(len).fill(0)
  for (const k of keys) {
    const vs = props.series[k] || []
    for (let i=0;i<len;i++) arr[i] += vs[i] || 0
  }
  return arr.map(v => Math.max(1, v)) // evita divisão por zero
})

const stacked = computed(() => {
  const len = props.labels.length
  const out = []
  for (let i=0;i<len;i++) {
    const col = []
    for (const k of keys) {
      const val = (props.series[k]?.[i]) || 0
      const h = Math.round((val / totals.value[i]) * 100)
      col.push({ key:k, h, class: classes[k] })
    }
    out.push(col)
  }
  return out
})

const tooltip = (idx) => {
  const parts = keys.map(k => `${k}: ${props.series[k]?.[idx] ?? 0}`)
  return `${props.labels[idx]}\n${parts.join('  ')}`
}

const showLabel = (i) => i % props.labelEvery === 0
</script>
