import type { ReactNode } from 'react'

/** Banda bordó con puntas de cinta, tomada del logo. Solo para el encabezado. */
export function Cinta({ children }: { children: ReactNode }) {
  return (
    <div className="bg-marca px-6 py-2 text-sobre-marca [clip-path:polygon(0_0,100%_0,calc(100%-14px)_50%,100%_100%,0_100%,14px_50%)]">
      {children}
    </div>
  )
}
