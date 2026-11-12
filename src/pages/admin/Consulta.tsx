import { useState } from 'react'
import { ListaVentas } from '../../components/caja/ListaVentas'
import { ExportarMes } from '../../components/ExportarMes'
import { ResumenDia } from '../../components/caja/ResumenDia'
import { TablaDatos } from '../../components/graficos/Piezas'
import { Indicador, Variacion } from '../../components/graficos/Piezas'
import { Boton } from '../../components/ui/Boton'
import { Cargando, MensajeError, Tarjeta, Titulo, Vacio } from '../../components/ui/Estados'
import { Segmentado } from '../../components/ui/Segmentado'
import { useJornadaPorFecha, useResumenJornada, useVentasDeJornada } from '../../datos/caja'
import { useFacturacionPorDia, useResumenPeriodo } from '../../datos/reportes'
import { variacion } from '../../lib/caja'
import { mensajeDeError } from '../../lib/errores'
import { fechaDeTrabajo, formatearPesos } from '../../lib/formato'
import {
  diaSemanaCorto,
  hastaHoy,
  moverPeriodo,
  periodo,
  type TipoPeriodo,
} from '../../lib/periodos'

export default function Consulta() {
  const hoy = fechaDeTrabajo(new Date())
  const [tipo, setTipo] = useState<TipoPeriodo>('dia')
  const [fecha, setFecha] = useState(hoy)
  const per = periodo(tipo, fecha)

  const atajo = (t: TipoPeriodo, f: string) => {
    setTipo(t)
    setFecha(f)
  }

  return (
    <div className="flex flex-col gap-4">
      <Titulo subtitulo="Mirá cualquier día, semana o mes.">Historial</Titulo>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Accesos rápidos">
        {[
          { t: 'dia' as const, f: hoy, texto: 'Hoy' },
          { t: 'dia' as const, f: moverPeriodo('dia', hoy, -1), texto: 'Ayer' },
          { t: 'semana' as const, f: hoy, texto: 'Esta semana' },
          { t: 'mes' as const, f: hoy, texto: 'Este mes' },
        ].map((a) => (
          <Boton
            key={a.texto}
            variante="secundario"
            className="min-h-11 px-4"
            onClick={() => atajo(a.t, a.f)}
          >
            {a.texto}
          </Boton>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
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
        <div className="flex items-center gap-1">
          <Boton
            variante="secundario"
            className="min-h-11 px-3"
            aria-label="Período anterior"
            onClick={() => setFecha((f) => moverPeriodo(tipo, f, -1))}
          >
            ←
          </Boton>
          <label className="sr-only" htmlFor="fecha-consulta">
            Fecha
          </label>
          <input
            id="fecha-consulta"
            type="date"
            value={fecha}
            max={hoy}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            className="min-h-11 rounded-xl border border-borde bg-superficie px-2 shadow-tarjeta"
          />
          <Boton
            variante="secundario"
            className="min-h-11 px-3"
            aria-label="Período siguiente"
            disabled={per.hasta >= hoy}
            onClick={() => setFecha((f) => moverPeriodo(tipo, f, 1))}
          >
            →
          </Boton>
        </div>
      </div>
      <h2 className="text-xl font-semibold first-letter:uppercase">{per.titulo}</h2>
      {tipo === 'dia' ? (
        <ConsultaDia fecha={fecha} />
      ) : (
        <ConsultaPeriodo tipo={tipo} fecha={fecha} />
      )}
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <Tarjeta className="flex flex-col gap-4 self-start">
        {resumen.data ? <ResumenDia resumen={resumen.data} /> : <Cargando />}
      </Tarjeta>
      <Tarjeta sinRelleno className="self-start">
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

function ConsultaPeriodo({ tipo, fecha }: { tipo: 'semana' | 'mes'; fecha: string }) {
  const per = hastaHoy(periodo(tipo, fecha), fechaDeTrabajo(new Date()))
  const actual = useResumenPeriodo(per)
  const anterior = useResumenPeriodo(per.anterior)
  const dias = useFacturacionPorDia(per)
  const base = tipo === 'semana' ? 'la semana anterior' : 'el mes anterior'
  const contra = per.recortado ? `los mismos días de ${base}` : base
  const p = (n: number) => formatearPesos(n, { sinCentavos: true })

  if (actual.isPending) return <Cargando />
  if (actual.isError) return <MensajeError>{mensajeDeError(actual.error)}</MensajeError>
  const a = actual.data
  const b = anterior.data
  if (!a || a.dias_trabajados === 0) return <Vacio titulo="No hubo caja en este período" />
  const v = (x: number, y: number | undefined) => (y === undefined ? null : variacion(x, y))

  return (
    <div className="flex flex-col gap-4">
      {tipo === 'mes' && <ExportarMes fecha={fecha} />}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          etiqueta="Facturación"
          valor={p(a.total)}
          detalle={<Variacion valor={v(a.total, b?.total)} contra={contra} />}
        />
        <Indicador
          etiqueta="Cantidad de ventas"
          valor={a.cantidad_ventas}
          detalle={<Variacion valor={v(a.cantidad_ventas, b?.cantidad_ventas)} contra={contra} />}
        />
        <Indicador
          etiqueta="Ticket promedio"
          valor={p(a.ticket_promedio)}
          detalle={<Variacion valor={v(a.ticket_promedio, b?.ticket_promedio)} contra={contra} />}
        />
        <Indicador
          etiqueta="Promedio por día"
          valor={p(a.promedio_diario)}
          detalle={<Variacion valor={v(a.promedio_diario, b?.promedio_diario)} contra={contra} />}
        />
        <Indicador
          etiqueta="Efectivo"
          valor={p(a.total_efectivo)}
          detalle={<Variacion valor={v(a.total_efectivo, b?.total_efectivo)} contra={contra} />}
        />
        <Indicador
          etiqueta="Digital"
          valor={p(a.total_digital)}
          detalle={<Variacion valor={v(a.total_digital, b?.total_digital)} contra={contra} />}
        />
        <Indicador etiqueta="Días trabajados" valor={a.dias_trabajados} />
      </div>
      <Tarjeta>
        <h3 className="mb-2 font-semibold">Día por día</h3>
        <TablaDatos
          columnas={['Día', 'Efectivo', 'Digital', 'Total', 'Ventas']}
          filas={(dias.data ?? []).map((d) =>
            d.trabajado
              ? [
                  diaSemanaCorto(d.fecha),
                  p(d.total_efectivo),
                  p(d.total_digital),
                  p(d.total),
                  d.cantidad_ventas,
                ]
              : [diaSemanaCorto(d.fecha), 'Cerrado', '', '', ''],
          )}
        />
      </Tarjeta>
    </div>
  )
}
