import { createRouter, createWebHistory } from 'vue-router'
import TotesView from '../views/TotesView.vue'

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
