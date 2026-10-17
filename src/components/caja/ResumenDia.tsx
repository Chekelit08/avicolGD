import type { ResumenJornada } from '../../datos/caja'
import { formatearPesos } from '../../lib/formato'

function Fila({ etiqueta, valor, fuerte }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-suave">{etiqueta}</dt>
      <dd className={`cifras ${fuerte ? 'text-xl font-bold' : 'font-bold'}`}>{valor}</dd>
    </div>
  )
}

/** Total, por tipo de pago, cantidad, ticket promedio y caja. Calculado por la base. */
export function ResumenDia({ resumen }: { resumen: ResumenJornada }) {
  const p = (n: number) => formatearPesos(n)
  const totalBarra = resumen.total || 1
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-suave">Total del día</p>
        <p className="text-4xl font-bold cifras">{p(resumen.total)}</p>
      </div>

      <div aria-hidden="true" className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-hundida">
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
          etiqueta={`Efectivo (${resumen.cantidad_efectivo} ventas)`}
          valor={p(resumen.total_efectivo)}
        />
        <Fila
          etiqueta={`Digital (${resumen.cantidad_digital} ventas)`}
          valor={p(resumen.total_digital)}
        />
        <Fila etiqueta="Cantidad de ventas" valor={String(resumen.cantidad_ventas)} />
        <Fila etiqueta="Ticket promedio" valor={p(resumen.ticket_promedio)} />
        {resumen.cantidad_anuladas > 0 && (
          <Fila etiqueta="Ventas anuladas (no suman)" valor={String(resumen.cantidad_anuladas)} />
        )}
        <Fila etiqueta="Fondo de caja inicial" valor={p(resumen.fondo_inicial)} />
        <Fila etiqueta="Efectivo esperado en caja" valor={p(resumen.efectivo_esperado)} fuerte />
        {resumen.efectivo_contado !== null && (
          <Fila etiqueta="Efectivo contado" valor={p(resumen.efectivo_contado)} />
        )}
      </dl>
      {resumen.diferencia_efectivo !== null && <Diferencia monto={resumen.diferencia_efectivo} />}
    </div>
  )
}

/** Diferencia de caja con color + ícono + texto (nunca solo color). */
export function Diferencia({ monto }: { monto: number }) {
  if (monto === 0) {
    return <p className="text-lg font-bold text-ok">✓ La caja coincide</p>
  }
  const sobra = monto > 0
  return (
    <p className={`text-lg font-bold ${sobra ? 'text-aviso' : 'text-alerta-texto'}`}>
      {sobra ? '▲ Sobran' : '▼ Faltan'} {formatearPesos(Math.abs(monto))}
    </p>
  )
}
