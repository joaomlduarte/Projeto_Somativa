<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import ToastHost from './components/ToastHost.vue'

const drawerOpen = ref(false)

function toggleDrawer() { drawerOpen.value = !drawerOpen.value }
function closeDrawer()  { drawerOpen.value = false }

const onResize = () => {
  // em telas grandes, mantemos sidebar fixa e garantimos drawer fechado
  if (window.innerWidth >= 1024) drawerOpen.value = false
}
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Topbar -->
    <!-- Ouve exatamente o evento que seu Navbar emite: 'toggle-sidebar' -->
    <Navbar @toggle-sidebar="toggleDrawer" />

    <!-- Shell principal -->
    <div class="flex">
      <!-- Sidebar fixa (>= lg) -->
      <aside class="hidden lg:block w-64 shrink-0 border-r bg-white">
        <Sidebar />
      </aside>

      <!-- Drawer mobile (somente < lg) -->
      <transition name="fade">
        <div
          v-if="drawerOpen"
          class="fixed inset-0 z-40 lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          <div class="absolute inset-0 bg-black/40" @click="closeDrawer" />
          <div class="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div class="flex items-center justify-between p-3 border-b">
              <div class="font-medium">Menu</div>
              <button class="px-2 py-1 rounded hover:bg-gray-100" @click="closeDrawer">×</button>
            </div>
            <Sidebar @navigate="closeDrawer" />
          </div>
        </div>
      </transition>

      <!-- Conteúdo -->
      <main class="flex-1 p-4 lg:p-6">
        <!-- Usa o <router-view> global nativo -->
        <router-view />
      </main>
    </div>
  </div>

  <!-- Toasts globais (seu ToastHost existente) -->
  <ToastHost />
</template>

<style>
/* Transição simples do backdrop do drawer */
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Garante altura 100% para evitar “saltos” de layout */
html, body, #app { height: 100%; }
</style>
