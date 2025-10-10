<template>
  <div class="w-full h-full flex items-center justify-center">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Donut chart">
      <g :transform="`translate(${size/2}, ${size/2})`">
        <circle :r="radius" :stroke-width="thickness" class="text-gray-200" stroke="currentColor" fill="transparent"/>
        <circle
          :r="radius"
          :stroke-width="thickness"
          class="text-gray-800"
          stroke="currentColor"
          fill="transparent"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="circumference - filled"
          stroke-linecap="round"
          transform="rotate(-90)"
        />
        <text text-anchor="middle" dominant-baseline="middle" class="font-semibold" :font-size="size * 0.18">
          {{ displayPct }}%
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },    // 0..1
  size: { type: Number, default: 160 },
  thickness: { type: Number, default: 16 },
})

const radius = computed(() => (props.size / 2) - (props.thickness / 2))
const circumference = computed(() => 2 * Math.PI * radius.value)
const filled = computed(() => Math.max(0, Math.min(1, props.value)) * circumference.value)
const displayPct = computed(() => Math.round(Math.max(0, Math.min(1, props.value)) * 100))
</script>
