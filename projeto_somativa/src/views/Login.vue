<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  errorMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = 'Preencha e-mail e senha.'
    return
  }
  loading.value = true
  const { ok, error } = await auth.login({ email: email.value, password: password.value })
  loading.value = false
  if (!ok) {
    errorMsg.value = error || 'Falha no login.'
    return
  }
  // redireciona para rota pretendida (query ?redirect=...)
  const to = route.query.redirect ? String(route.query.redirect) : '/'
  router.replace(to)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-md rounded-2xl border bg-white shadow-sm p-6">
      <h1 class="text-lg font-semibold mb-1">Entrar</h1>
      <p class="text-sm text-gray-500 mb-4">Acesse sua conta para continuar.</p>

      <div class="space-y-3">
        <div>
          <label class="block text-sm mb-1">E-mail</label>
          <input v-model="email" type="email" class="w-full border rounded-xl px-3 py-2" placeholder="ex: admin@smpm.local"/>
        </div>
        <div>
          <label class="block text-sm mb-1">Senha</label>
          <input v-model="password" type="password" class="w-full border rounded-xl px-3 py-2" placeholder="ex: 123456"/>
        </div>

        <div v-if="errorMsg" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-2">
          {{ errorMsg }}
        </div>

        <button
          class="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 disabled:opacity-60"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? 'Entrando…' : 'Entrar' }}
        </button>

        <div class="text-xs text-gray-500">
          Dica (fallback local): <code>admin@smpm.local</code> / <code>123456</code>
        </div>
      </div>
    </div>
  </div>
</template>
