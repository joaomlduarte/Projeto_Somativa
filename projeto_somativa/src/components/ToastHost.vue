<!-- src/components/ToastHost.vue -->
<template>
  <div class="fixed z-50 top-4 right-4 flex flex-col gap-2 w-80">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="rounded-2xl shadow-lg p-3 text-sm border"
      :class="{
        'bg-green-50 border-green-200 text-green-900': t.type === 'success',
        'bg-red-50 border-red-200 text-red-900': t.type === 'error',
        'bg-blue-50 border-blue-200 text-blue-900': t.type === 'info'
      }"
    >
      <div class="flex items-start gap-2">
        <strong class="capitalize">{{ t.type }}</strong>
        <span class="flex-1">{{ t.message }}</span>
        <button @click="remove(t.id)" class="px-2 leading-none rounded hover:bg-black/5">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/store/toast' // ✅ pasta correta é "store", não "stores"

const toast = useToastStore()
const { toasts } = storeToRefs(toast)
const remove = (id) => toast.remove(id)
</script>
