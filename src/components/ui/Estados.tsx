import type { ReactNode } from 'react'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12 text-suave">
      <span
        className="size-5 animate-spin rounded-full border-2 border-borde border-t-marca"
        aria-hidden="true"
      />
      {texto}
    </div>
  )
}

export function MensajeError({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-alerta px-4 py-3 font-bold text-white"
    >
      <span>{children}</span>
      {accion}
    </div>
  )
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-borde px-4 py-8 text-center">
      <p className="font-bold">{titulo}</p>
      {children && <div className="mt-1 text-suave">{children}</div>}
    </div>
  )
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-borde bg-superficie p-4 ${className}`}>
      {children}
    </div>
  )
}

export function Titulo({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-cartel text-4xl font-extrabold uppercase">{children}</h1>
      {accion}
    </div>
  )
}

/** Medio de pago con su color, siempre con texto (nunca solo color). */
export function EtiquetaMedio({ medio }: { medio: 'efectivo' | 'digital' }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-block size-2.5 rounded-full ${medio === 'efectivo' ? 'bg-grafico-efectivo' : 'bg-grafico-digital'}`}
      />
      {medio === 'efectivo' ? 'Efectivo' : 'Digital'}
    </span>
  )
}
