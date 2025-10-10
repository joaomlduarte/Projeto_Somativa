<template>
  <div class="w-full">
    <div class="flex justify-between items-end gap-1 h-40 w-full border-b pb-1">
      <div v-for="(v,i) in values" :key="i" class="flex-1 flex flex-col items-center gap-1">
        <div class="w-full bg-gray-200 rounded-t" :style="{ height: scaled(v) + '%' }"></div>
      </div>
    </div>
    <div class="flex justify-between text-[10px] text-gray-500 mt-1">
      <span v-for="(l,i) in labels" :key="i">{{ l }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  values: { type: Array, required: true }, // números
  labels: { type: Array, required: true }, // strings curtas (podem ter vazios)
})

const scaled = (v) => {
  const max = Math.max(1, Math.max(...props.values))
  return Math.round((v / max) * 100)
}
</script>
