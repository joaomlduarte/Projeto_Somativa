// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

// Import estático das views
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Manutencoes from '@/views/Manutencoes.vue'
import DetalheManutencao from '@/views/DetalheManutencao.vue'
import Calendario from '@/views/Calendario.vue'
import Maquinas from '@/views/Maquinas.vue'
import Setores from '@/views/Setores.vue'

const routes = [
  { path: '/login', name: 'login', component: Login, meta: { public: true } },

  // Rotas protegidas
  { path: '/',               name: 'dashboard',     component: Dashboard,        meta: { requiresAuth: true } },
  { path: '/manutencoes',    name: 'manutencoes',   component: Manutencoes,      meta: { requiresAuth: true } },
  { path: '/manutencoes/:id',name: 'detalhe',       component: DetalheManutencao,meta: { requiresAuth: true }, props: true },
  { path: '/calendario',     name: 'calendario',    component: Calendario,       meta: { requiresAuth: true } },
  { path: '/maquinas',       name: 'maquinas',      component: Maquinas,         meta: { requiresAuth: true } },
  { path: '/setores',        name: 'setores',       component: Setores,          meta: { requiresAuth: true } },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { left: 0, top: 0 } }
})

// Guard de autenticação
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta?.public) return true
  if (to.meta?.requiresAuth && !auth.isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
