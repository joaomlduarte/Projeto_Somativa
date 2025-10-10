<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    class="inline-flex items-center justify-center rounded px-3 py-2 transition border disabled:opacity-60"
    :class="[
      variant === 'primary'
        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
        : 'bg-white text-gray-900 border hover:bg-gray-50'
    ]"
  >
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4 mr-2"
      xmlns="http://www.w3.org/2000/svg"
      fill="none" viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  variant: { type: String, default: 'primary' }, // 'primary' | 'ghost'
  type:    { type: String, default: 'button' },
})
</script>
