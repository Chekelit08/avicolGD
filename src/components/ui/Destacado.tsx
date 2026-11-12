import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** El número más importante de la pantalla: tarjeta bordó con texto blanco. */
export function TotalDestacado({
  etiqueta,
  valor,
  detalle,
  Icono,
}: {
  etiqueta: string
  valor: ReactNode
  detalle?: ReactNode
  Icono?: LucideIcon
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-marca to-marca-hover p-5 text-sobre-marca shadow-alta">
      {Icono && (
        <Icono
          className="pointer-events-none absolute -right-4 -bottom-6 size-32 opacity-10"
          aria-hidden="true"
        />
      )}
      <p className="text-xs font-medium tracking-wide uppercase opacity-80">{etiqueta}</p>
      <p className="mt-1 text-4xl font-semibold tracking-tight cifras sm:text-5xl">{valor}</p>
      {detalle && <div className="mt-1 text-sm opacity-90">{detalle}</div>}
    </div>
  )
}

/** Un dato secundario con su ícono en un recuadro de color. */
export function DatoConIcono({
  Icono,
  tono,
  etiqueta,
  valor,
  detalle,
}: {
  Icono: LucideIcon
  /** Clases de fondo y color del ícono, por ejemplo "bg-marca-suave text-marca". */
  tono: string
  etiqueta: string
  valor: ReactNode
  detalle?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-borde bg-superficie p-4 shadow-tarjeta">
      <p className="flex items-center gap-2 text-xs font-medium text-suave">
        <span className={`grid size-7 place-items-center rounded-lg ${tono}`}>
          <Icono className="size-4" aria-hidden="true" />
        </span>
        {etiqueta}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight cifras">{valor}</p>
      {detalle && <div className="mt-0.5 text-xs text-suave">{detalle}</div>}
    </div>
  )
}
