<template>
  <aside class="w-64 h-full border-r bg-white">
    <div class="h-14 px-4 flex items-center font-medium">Navegação</div>

    <nav class="px-2 pb-4 space-y-1">
      <RouterLink
        to="/"
        class="block px-3 py-2 rounded hover:bg-gray-100"
        :class="isActive('/') ? 'bg-gray-100 font-medium' : 'text-gray-700'"
      >
        Dashboard
      </RouterLink>

      <RouterLink
        to="/manutencoes"
        class="block px-3 py-2 rounded hover:bg-gray-100"
        :class="isActive('/manutencoes') ? 'bg-gray-100 font-medium' : 'text-gray-700'"
      >
        Manutenções
      </RouterLink>

      <RouterLink
        to="/calendario"
        class="block px-3 py-2 rounded hover:bg-gray-100"
        :class="isActive('/calendario') ? 'bg-gray-100 font-medium' : 'text-gray-700'"
      >
        Calendário
      </RouterLink>

      <RouterLink
  to="/maquinas"
  class="block px-3 py-2 rounded hover:bg-gray-100"
  :class="isActive('/maquinas') ? 'bg-gray-100 font-medium' : 'text-gray-700'"
>
  Máquinas
</RouterLink>

    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const isActive = (path) => route.path === path
</script>
