<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const auth = useAuthStore()

const emit = defineEmits(['toggle-sidebar'])

function toggleSidebar() {
  // Emite pro App.vue abrir/fechar o drawer no mobile
  emit('toggle-sidebar')
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur">
    <div class="flex h-14 items-center justify-between px-3 sm:px-4">
      <!-- Esquerda: botão menu (mobile) + brand -->
      <div class="flex items-center gap-3">
        <!-- Botão hamburguer (mobile) -->
        <button
          class="inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-sm hover:bg-gray-50 sm:hidden"
          @click="toggleSidebar"
          aria-label="Abrir navegação"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Brand: logo + texto KeepUp -->
        <div class="flex items-center gap-2">
          <!-- Ajuste o caminho do logo se necessário -->
          <img src="/logo.png" alt="KeepUp" class="h-6 w-6 rounded-sm object-contain" />
          <span class="select-none text-sm font-medium text-gray-700">
            KeepUp <span class="hidden sm:inline">- Sistema de Manutenção</span>
          </span>
        </div>
      </div>

      <!-- Direita: avatar + sair -->
      <div class="flex items-center gap-3">
        <!-- Avatar do usuário -->
        <img
          v-if="auth.user"
          src="/avatar-admin.png"
          alt="Admin"
          class="h-8 w-8 rounded-full object-cover"
        />

        <!-- Botão de logout -->
        <button
          @click="logout"
          class="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
        >
          Sair
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Opcional: mantém a barra superior “fixa” agradável em iOS/desktop */
header { -webkit-backdrop-filter: saturate(180%) blur(8px); backdrop-filter: saturate(180%) blur(8px); }
</style>
