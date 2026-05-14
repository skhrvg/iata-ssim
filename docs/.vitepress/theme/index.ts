import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import Banner from './components/Banner.vue'
import JsonTree from './components/JsonTree.vue'
import Playground from './components/Playground.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-top': () => h(Banner),
    }),
  enhanceApp({ app }: { app: import('vue').App }) {
    app.component('Playground', Playground)
    app.component('JsonTree', JsonTree)
  },
}
