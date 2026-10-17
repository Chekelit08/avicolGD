import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Estilo } from './pages/Estilo'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/estilo" element={<Estilo />} />
        {/* Fase 0: todavía no hay pantallas reales; la raíz muestra la guía de estilo. */}
        <Route path="*" element={<Navigate to="/estilo" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
