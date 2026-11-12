import type { ResumenJornada } from '../../datos/caja'
import { cantidadVentas, formatearPesos } from '../../lib/formato'

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
      <dt className="text-suave">{etiqueta}</dt>
      <dd className={`cifras ${fuerte ? 'text-base font-semibold' : 'font-medium'}`}>{valor}</dd>
    </div>
  )
}

/** Total, por tipo de pago, cantidad y ticket promedio. Calculado por la base. */
export function ResumenDia({ resumen }: { resumen: ResumenJornada }) {
  const p = (n: number) => formatearPesos(n)
  const totalBarra = resumen.total || 1
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-suave">Total del día</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight cifras">{p(resumen.total)}</p>
      </div>

      <div aria-hidden="true" className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-hundida">
        <div
          className="bg-grafico-efectivo"
          style={{ width: `${(resumen.total_efectivo / totalBarra) * 100}%` }}
        />
        <div
          className="bg-grafico-digital"
          style={{ width: `${(resumen.total_digital / totalBarra) * 100}%` }}
        />
      </div>

      <dl className="divide-y divide-borde">
        <Fila
          etiqueta={`Efectivo (${cantidadVentas(resumen.cantidad_efectivo)})`}
          valor={p(resumen.total_efectivo)}
        />
        <Fila
          etiqueta={`Digital (${cantidadVentas(resumen.cantidad_digital)})`}
          valor={p(resumen.total_digital)}
        />
        <Fila etiqueta="Cantidad de ventas" valor={String(resumen.cantidad_ventas)} />
        <Fila etiqueta="Ticket promedio" valor={p(resumen.ticket_promedio)} />
        {resumen.cantidad_anuladas > 0 && (
          <Fila etiqueta="Ventas anuladas (no suman)" valor={String(resumen.cantidad_anuladas)} />
        )}
      </dl>
    </div>
  )
}
