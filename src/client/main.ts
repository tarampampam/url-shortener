import { mount } from 'svelte'
import { App } from './app'
import './app/theme.css'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
