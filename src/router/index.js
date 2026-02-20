import { createRouter, createWebHistory } from 'vue-router'
import TotesView from '../views/TotesView.vue'
import LinesView from '../views/LinesView.vue'

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
    path: '/about',
    name: 'about',
    component: function () {
      return import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
    }
  }
]

const router = createRouter({
  history: createWebHistory('/app/'),
  routes
})

export default router
