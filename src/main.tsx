import '@fontsource/atkinson-hyperlegible-next/latin-400'
import '@fontsource/atkinson-hyperlegible-next/latin-700'
import '@fontsource/big-shoulders-display/latin-800'
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
