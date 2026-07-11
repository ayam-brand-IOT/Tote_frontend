import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import DashboardView from '../views/DashboardView.vue'
import TotesView from '../views/TotesView.vue'
import LinesView from '../views/LinesView.vue'
import ProductsView from '../views/ProductsView.vue'
import ExportView from '../views/ExportView.vue'
import LoginView from '../views/LoginView.vue'
import ConfigView from '../views/ConfigView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/totes', name: 'totes', component: TotesView, meta: { requiresAuth: true } },
  { path: '/products', name: 'products', component: ProductsView, meta: { requiresAuth: true } },
  { path: '/lines', name: 'lines', component: LinesView, meta: { requiresAuth: true } },
  { path: '/export', name: 'export', component: ExportView, meta: { requiresAuth: true } },
  { path: '/config', name: 'config', component: ConfigView, meta: { requiresAuth: true, management: true } },
]

const router = createRouter({
  history: createWebHistory('/app/'),
  routes,
})

router.beforeEach((to) => {
  const isAuthed = store.getters.isAuthenticated
  const isManagement = store.getters.isManagement

  if (to.meta.public) {
    // Keep authenticated users out of the login page.
    if (to.name === 'login' && isAuthed) return { name: 'dashboard' }
    return true
  }

  if (to.meta.requiresAuth && !isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Management-only areas (Config, user management).
  if (to.meta.management && !isManagement) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
