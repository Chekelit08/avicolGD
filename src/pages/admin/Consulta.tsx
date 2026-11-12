import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ShoppingBag,
  Smartphone,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { ListaVentas } from '../../components/caja/ListaVentas'
import { ExportarMes } from '../../components/ExportarMes'
import { Variacion } from '../../components/graficos/Piezas'
import { Boton } from '../../components/ui/Boton'
import { DatoConIcono, TotalDestacado } from '../../components/ui/Destacado'
import { Cargando, MensajeError, Tarjeta, Titulo, Vacio } from '../../components/ui/Estados'
import { Segmentado } from '../../components/ui/Segmentado'
import { useJornadaPorFecha, useResumenJornada, useVentasDeJornada } from '../../datos/caja'
import { useFacturacionPorDia, useResumenPeriodo } from '../../datos/reportes'
import { variacion } from '../../lib/caja'
import { mensajeDeError } from '../../lib/errores'
import { cantidadVentas, fechaDeTrabajo, formatearPesos } from '../../lib/formato'
import {
  diaSemanaCorto,
  hastaHoy,
  moverPeriodo,
  periodo,
  type TipoPeriodo,
} from '../../lib/periodos'

const p = (n: number) => formatearPesos(n, { sinCentavos: true })

export default function Consulta() {
  const hoy = fechaDeTrabajo(new Date())
  const [tipo, setTipo] = useState<TipoPeriodo>('dia')
  const [fecha, setFecha] = useState(hoy)
  const per = periodo(tipo, fecha)
  const enHoy = per.desde <= hoy && per.hasta >= hoy

  return (
    <div className="flex flex-col gap-4">
      <Titulo subtitulo="Mirá cualquier día, semana o mes.">Historial</Titulo>

      <Tarjeta className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmentado
            etiqueta="Ver por"
            valor={tipo}
            onCambio={setTipo}
            opciones={[
              { valor: 'dia', texto: 'Día' },
              { valor: 'semana', texto: 'Semana' },
              { valor: 'mes', texto: 'Mes' },
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-suave">
            <CalendarDays className="size-4" aria-hidden="true" />
            <span className="sr-only">Elegir fecha</span>
            <input
              type="date"
              value={fecha}
              max={hoy}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              className="min-h-11 rounded-[10px] border border-borde-fuerte bg-superficie px-3 text-texto shadow-tarjeta"
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Boton
            variante="secundario"
            className="size-12 shrink-0 px-0"
            aria-label="Anterior"
            onClick={() => setFecha((f) => moverPeriodo(tipo, f, -1))}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Boton>
          <div className="min-w-0 text-center">
            <h2 className="truncate text-xl font-semibold tracking-tight first-letter:uppercase sm:text-2xl">
              {per.titulo}
            </h2>
            {!enHoy && (
              <button
                type="button"
                onClick={() => setFecha(hoy)}
                className="min-h-9 text-sm font-semibold text-marca underline-offset-4 hover:underline"
              >
                Volver a hoy
              </button>
            )}
          </div>
          <Boton
            variante="secundario"
            className="size-12 shrink-0 px-0"
            aria-label="Siguiente"
            disabled={per.hasta >= hoy}
            onClick={() => setFecha((f) => moverPeriodo(tipo, f, 1))}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </Boton>
        </div>
      </Tarjeta>

      {tipo === 'dia' ? (
        <ConsultaDia fecha={fecha} />
      ) : (
        <ConsultaPeriodo
          tipo={tipo}
          fecha={fecha}
          alElegirDia={(f) => {
            setTipo('dia')
            setFecha(f)
          }}
        />
      )}
    </div>
  )
}

function Medios({
  efectivo,
  digital,
  ventas,
  ticket,
}: {
  efectivo: number
  digital: number
  ventas: number
  ticket: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <DatoConIcono
        Icono={Banknote}
        tono="bg-marca-suave text-marca"
        etiqueta="Efectivo"
        valor={p(efectivo)}
      />
      <DatoConIcono
        Icono={Smartphone}
        tono="bg-digital-suave text-digital"
        etiqueta="Digital"
        valor={p(digital)}
      />
      <DatoConIcono
        Icono={ShoppingBag}
        tono="bg-hundida text-texto"
        etiqueta="Ventas"
        valor={ventas}
      />
      <DatoConIcono
        Icono={Receipt}
        tono="bg-ok-suave text-ok"
        etiqueta="Ticket promedio"
        valor={p(Math.round(ticket))}
      />
    </div>
  )
}

function ConsultaDia({ fecha }: { fecha: string }) {
  const jornada = useJornadaPorFecha(fecha)
  const resumen = useResumenJornada(jornada.data?.id)
  const ventas = useVentasDeJornada(jornada.data?.id)

  if (jornada.isPending) return <Cargando />
  if (jornada.isError) return <MensajeError>{mensajeDeError(jornada.error)}</MensajeError>
  if (!jornada.data) return <Vacio titulo="Ese día no se cargaron ventas" />
  const j = jornada.data
  const r = resumen.data

  return (
    <div className="flex flex-col gap-4">
      {r ? (
        <>
          <TotalDestacado
            etiqueta="Vendido en el día"
            valor={p(r.total)}
            detalle={cantidadVentas(r.cantidad_ventas)}
            Icono={TrendingUp}
          />
          <Medios
            efectivo={r.total_efectivo}
            digital={r.total_digital}
            ventas={r.cantidad_ventas}
            ticket={r.ticket_promedio}
          />
        </>
      ) : (
        <Cargando />
      )}
      <Tarjeta sinRelleno>
        {ventas.data ? (
          <ListaVentas
            ventas={ventas.data}
            editable={j.estado === 'abierta'}
            limite={25}
            titulo="Ventas del día"
          />
        ) : (
          <Cargando />
        )}
      </Tarjeta>
    </div>
  )
}

function ConsultaPeriodo({
  tipo,
  fecha,
  alElegirDia,
}: {
  tipo: 'semana' | 'mes'
  fecha: string
  alElegirDia: (fecha: string) => void
}) {
  const per = hastaHoy(periodo(tipo, fecha), fechaDeTrabajo(new Date()))
  const actual = useResumenPeriodo(per)
  const anterior = useResumenPeriodo(per.anterior)
  const dias = useFacturacionPorDia(per)
  const base = tipo === 'semana' ? 'la semana anterior' : 'el mes anterior'
  const contra = per.recortado ? `los mismos días de ${base}` : base

  if (actual.isPending) return <Cargando />
  if (actual.isError) return <MensajeError>{mensajeDeError(actual.error)}</MensajeError>
  const a = actual.data
  const b = anterior.data
  if (!a || a.dias_trabajados === 0) return <Vacio titulo="No hubo ventas en este período" />
  const maximo = Math.max(1, ...(dias.data ?? []).map((d) => d.total))

  return (
    <div className="flex flex-col gap-4">
      <TotalDestacado
        etiqueta={tipo === 'semana' ? 'Vendido en la semana' : 'Vendido en el mes'}
        valor={p(a.total)}
        detalle={`${a.dias_trabajados} ${a.dias_trabajados === 1 ? 'día' : 'días'} con ventas · promedio ${p(a.promedio_diario)} por día`}
        Icono={TrendingUp}
      />
      {b && (
        <p className="px-1">
          <Variacion valor={variacion(a.total, b.total)} contra={contra} />
        </p>
      )}
      <Medios
        efectivo={a.total_efectivo}
        digital={a.total_digital}
        ventas={a.cantidad_ventas}
        ticket={a.ticket_promedio}
      />
      <Tarjeta sinRelleno>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde px-5 py-3">
          <h3 className="text-[15px] font-semibold">Día por día</h3>
          <span className="text-sm text-suave">Tocá un día para ver sus ventas</span>
        </div>
        <ul className="divide-y divide-borde">
          {(dias.data ?? []).map((d) => (
            <li key={d.fecha}>
              <button
                type="button"
                disabled={!d.trabajado}
                onClick={() => alElegirDia(d.fecha)}
                className="grid min-h-12 w-full grid-cols-[5.5rem_1fr_auto] items-center gap-3 px-5 text-left hover:bg-hundida disabled:hover:bg-transparent"
              >
                <span className="text-sm first-letter:uppercase">{diaSemanaCorto(d.fecha)}</span>
                <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-hundida">
                  <span
                    className="block h-full rounded-full bg-grafico-ingresos"
                    style={{ width: `${(d.total / maximo) * 100}%` }}
                  />
                </span>
                <span
                  className={`w-28 text-right cifras ${d.trabajado ? 'font-semibold' : 'text-sm text-suave'}`}
                >
                  {d.trabajado ? p(d.total) : 'Sin ventas'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Tarjeta>
      {tipo === 'mes' && <ExportarMes fecha={fecha} />}
    </div>
  )
}
