import '@fontsource-variable/inter'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/app.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Falta el elemento #root en index.html')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Cuando se publica una versión nueva, la app se actualiza sola: sin esto, la pantalla
// abierta seguía mostrando la versión vieja hasta que alguien recargaba a mano.
if ('serviceWorker' in navigator) {
  let teniaControl = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (teniaControl) window.location.reload()
    teniaControl = true
  })
  // La compu del mostrador puede quedar abierta días: buscar versión nueva cada hora.
  window.setInterval(() => {
    void navigator.serviceWorker.getRegistration().then((r) => r?.update())
  }, 60 * 60_000)
}
