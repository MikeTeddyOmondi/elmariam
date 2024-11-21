import './app.css'
import App from './App.svelte'
import './interceptors/axios.js'

const app = new App({
  target: document.getElementById('app'),
})

export default app
