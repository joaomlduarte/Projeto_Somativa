<template>
  <div class="w-full">
    <svg :viewBox="`0 0 ${w} ${h}`" class="w-full h-44" role="img" aria-label="Line chart">
      <line :x1="pad" :y1="h-pad" :x2="w-pad" :y2="h-pad" stroke="currentColor" class="text-gray-300"/>
      <line :x1="pad" :y1="pad"   :x2="pad"   :y2="h-pad" stroke="currentColor" class="text-gray-300"/>

      <path :d="areaPath" class="text-blue-200" fill="currentColor" fill-opacity="0.6"/>
      <polyline :points="polyPoints" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-600"/>

      <g v-for="(p,i) in pts" :key="i">
        <circle :cx="p.x" :cy="p.y" r="3" class="text-blue-600" fill="currentColor">
          <title>{{ labels[i] }} — {{ values[i] }}</title>
        </circle>
      </g>
    </svg>

    <div class="flex justify-between text-[10px] text-gray-500 mt-1">
      <span v-for="(l,i) in labels" :key="i">{{ showLabel(i) ? l : '' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: { type: Array, required: true },
  labels: { type: Array, required: true },
  labelEvery: { type: Number, default: 5 },
  w: { type: Number, default: 600 },
  h: { type: Number, default: 180 },
  pad: { type: Number, default: 24 },
})

const maxV = computed(() => Math.max(1, ...props.values))
const minV = computed(() => 0)

const scaleX = (i) => {
  const usable = props.w - props.pad * 2
  const step = props.values.length <= 1 ? 0 : usable / (props.values.length - 1)
  return props.pad + i * step
}
const scaleY = (v) => {
  const usable = props.h - props.pad * 2
  const t = (v - minV.value) / (maxV.value - minV.value || 1)
  return props.h - props.pad - t * usable
}

const pts = computed(() => props.values.map((v,i) => ({ x: scaleX(i), y: scaleY(v) })))
const polyPoints = computed(() => pts.value.map(p => `${p.x},${p.y}`).join(' '))
const areaPath = computed(() => {
  if (!pts.value.length) return ''
  const first = pts.value[0]
  const last = pts.value[pts.value.length - 1]
  return `M ${first.x} ${props.h - props.pad} L ${polyPoints.value} L ${last.x} ${props.h - props.pad} Z`
})

const showLabel = (i) => i % props.labelEvery === 0
</script>
