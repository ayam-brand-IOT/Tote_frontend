import { createApp } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import App from './App.vue'
import router from './router'
import store from './store'
import { installFetchInterceptor } from './utils/http'
import './assets/styles/base.scss'

// Attach the bearer token to /api calls and centralise 401 handling.
installFetchInterceptor({
  onUnauthorized() {
    store.dispatch('logout')
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    }
  },
})

// Validate any stored session before first render so route guards see the role.
store.dispatch('fetchMe').finally(() => {
  createApp(App)
    .use(store)
    .use(router)
    .use(VueApexCharts)
    .mount('#app')
})
