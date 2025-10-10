// Importa a função principal do Vue
import { createApp } from 'vue'
// Importa o gerenciador de estado global
import { createPinia } from 'pinia'
// Importa o roteador que acabamos de configurar
import router from './router'
// Importa o componente raiz (layout base)
import App from './App.vue'
// Importa o CSS do Tailwind (compilado via PostCSS)
import './assets/tailwind.css'

// Cria a app Vue, registra Pinia e Router e monta na div #app
createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app')
