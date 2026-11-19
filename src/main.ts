import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installI18n } from './i18n'

const app = createApp(App)

app.use(createPinia())
app.use(router)
installI18n(app)

app.mount('#app')

const oldFetch = window.fetch
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await oldFetch(input, init)
  if (router?.currentRoute?.value?.name != 'login') {
    if (response.status == 401) {
      router.push('/login')
    }
  }

  return response
}
