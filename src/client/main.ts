import { mount } from 'svelte'
import { App, theme as _ } from './app' // eslint-disable-line @typescript-eslint/no-unused-vars

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
