import { createRouter, createWebHistory } from 'vue-router'
import TotesView from '../views/TotesView.vue'
import LinesView from '../views/LinesView.vue'
import ExportView from '../views/ExportView.vue'

const routes = [
  {
    path: '/',
    name: 'totes',
    component: TotesView
  },
  {
    path: '/totes',
    redirect: '/'
  },
  {
    path: '/lines',
    name: 'lines',
    component: LinesView
  },
  {
    path: '/export',
    name: 'export',
    component: ExportView
  },
]

const router = createRouter({
  history: createWebHistory('/app/'),
  routes
})

export default router
