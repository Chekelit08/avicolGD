import type { ButtonHTMLAttributes } from 'react'

type Variante = 'marca' | 'secundario' | 'peligro' | 'texto'

const VARIANTES: Record<Variante, string> = {
  marca: 'bg-marca text-sobre-marca hover:brightness-110',
  secundario: 'border-borde bg-superficie text-texto border hover:bg-hundida',
  peligro: 'bg-alerta text-white hover:brightness-110',
  texto: 'text-texto underline-offset-4 hover:underline',
}

export function Boton({
  variante = 'marca',
  className = '',
  cargando = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; cargando?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-xl px-5 font-bold select-none disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {cargando ? 'Un momento…' : children}
    </button>
  )
}
