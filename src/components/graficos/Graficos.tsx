import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  EgresosCategoria,
  FacturacionAgrupada,
  FacturacionDia,
  IngresosEgresosMes,
  VentasDiaSemana,
} from '../../datos/reportes'
import { formatearPesos, formatearPesosCompacto, formatearPorcentaje } from '../../lib/formato'
import { diaSemanaCorto, fechaCorta, nombreMes, NOMBRES_DIA_SEMANA } from '../../lib/periodos'
import { COLORES, EJE } from './colores'
import { TablaDatos, TarjetaGrafico, TooltipPesos } from './Piezas'

const p = (n: number) => formatearPesos(n, { sinCentavos: true })
const ALTO = 260
const BARRA_MAX = 24
const PUNTA: [number, number, number, number] = [4, 4, 0, 0]

const LEYENDA_MEDIOS = [
  { color: COLORES.efectivo, texto: 'Efectivo' },
  { color: COLORES.digital, texto: 'Digital' },
]

// ---------------------------------------------------------------------------
// ¿Cuánto se vendió cada día? ¿Qué días estuvieron por debajo del promedio?
// ---------------------------------------------------------------------------
export function GraficoFacturacionDiaria({
  datos,
  cargando,
}: {
  datos: FacturacionDia[]
  cargando?: boolean
}) {
  const trabajados = datos.filter((d) => d.trabajado)
  const promedio = trabajados.length
    ? trabajados.reduce((s, d) => s + d.total, 0) / trabajados.length
    : 0
  const cerrados = new Set(datos.filter((d) => !d.trabajado).map((d) => d.fecha))

  return (
    <TarjetaGrafico
      titulo="Facturación por día"
      subtitulo={`Promedio por día trabajado: ${p(promedio)}`}
      leyenda={[...LEYENDA_MEDIOS, { color: COLORES.texto, texto: 'Promedio', forma: 'linea' }]}
      cargando={cargando}
      tabla={
        <TablaDatos
          columnas={['Día', 'Efectivo', 'Digital', 'Total', 'Ventas']}
          filas={datos.map((d) =>
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
      }
    >
      <ResponsiveContainer width="100%" height={ALTO}>
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={COLORES.grilla} />
          <XAxis dataKey="fecha" tickFormatter={fechaCorta} {...EJE} minTickGap={16} />
          <YAxis tickFormatter={formatearPesosCompacto} {...EJE} axisLine={false} width={64} />
          <Tooltip
            cursor={{ fill: COLORES.grilla, opacity: 0.6 }}
            content={
              <TooltipPesos
                formatoEtiqueta={diaSemanaCorto}
                nota={(f) => (cerrados.has(f) ? 'Cerrado: no hubo caja' : null)}
              />
            }
          />
          <Bar
            dataKey="total_efectivo"
            name="Efectivo"
            stackId="medio"
            fill={COLORES.efectivo}
            maxBarSize={BARRA_MAX}
            stroke={COLORES.superficie}
            strokeWidth={1}
          />
          <Bar
            dataKey="total_digital"
            name="Digital"
            stackId="medio"
            fill={COLORES.digital}
            maxBarSize={BARRA_MAX}
            radius={PUNTA}
            stroke={COLORES.superficie}
            strokeWidth={1}
          />
          {promedio > 0 && (
            <ReferenceLine
              y={promedio}
              stroke={COLORES.texto}
              strokeWidth={1.5}
              ifOverflow="extendDomain"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </TarjetaGrafico>
  )
}

// ---------------------------------------------------------------------------
// ¿Cómo vienen las semanas / los meses?
// ---------------------------------------------------------------------------
export function GraficoFacturacionAgrupada({
  datos,
  unidad,
  accion,
  cargando,
}: {
  datos: FacturacionAgrupada[]
  unidad: 'week' | 'month'
  accion?: React.ReactNode
  cargando?: boolean
}) {
  const etiqueta = (f: string) => (unidad === 'month' ? nombreMes(f) : `Sem. ${fechaCorta(f)}`)
  return (
    <TarjetaGrafico
      titulo={unidad === 'month' ? 'Facturación por mes' : 'Facturación por semana'}
      subtitulo={unidad === 'week' ? 'Semanas de lunes a domingo' : undefined}
      leyenda={LEYENDA_MEDIOS}
      accion={accion}
      cargando={cargando}
      tabla={
        <TablaDatos
          columnas={[unidad === 'month' ? 'Mes' : 'Semana', 'Efectivo', 'Digital', 'Total', 'Días']}
          filas={datos.map((d) => [
            etiqueta(d.periodo),
            p(d.total_efectivo),
            p(d.total_digital),
            p(d.total),
            d.dias_trabajados,
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={ALTO}>
        <BarChart data={datos} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={COLORES.grilla} />
          <XAxis dataKey="periodo" tickFormatter={etiqueta} {...EJE} />
          <YAxis tickFormatter={formatearPesosCompacto} {...EJE} axisLine={false} width={64} />
          <Tooltip
            cursor={{ fill: COLORES.grilla, opacity: 0.6 }}
            content={<TooltipPesos formatoEtiqueta={etiqueta} />}
          />
          <Bar
            dataKey="total_efectivo"
            name="Efectivo"
            stackId="m"
            fill={COLORES.efectivo}
            maxBarSize={BARRA_MAX * 2}
            stroke={COLORES.superficie}
            strokeWidth={1}
          />
          <Bar
            dataKey="total_digital"
            name="Digital"
            stackId="m"
            fill={COLORES.digital}
            maxBarSize={BARRA_MAX * 2}
            radius={PUNTA}
            stroke={COLORES.superficie}
            strokeWidth={1}
          >
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v) => formatearPesosCompacto(Number(v))}
              fill={COLORES.suave}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </TarjetaGrafico>
  )
}

// ---------------------------------------------------------------------------
// ¿Cuánto entra en efectivo y cuánto digital? (dos partes: barra dividida, no torta)
// ---------------------------------------------------------------------------
export function DistribucionMedios({ efectivo, digital }: { efectivo: number; digital: number }) {
  const total = efectivo + digital
  const pe = total ? (efectivo / total) * 100 : 0
  const pd = total ? 100 - pe : 0
  return (
    <TarjetaGrafico titulo="Efectivo y digital" subtitulo="Del total vendido en el período">
      <div className="flex flex-col gap-3">
        <div aria-hidden="true" className="flex h-6 gap-0.5 overflow-hidden rounded-md">
          <div style={{ width: `${pe}%`, background: COLORES.efectivo }} />
          <div style={{ width: `${pd}%`, background: COLORES.digital }} />
        </div>
        <dl className="grid grid-cols-2 gap-3">
          {[
            { n: 'Efectivo', v: efectivo, pc: pe, c: COLORES.efectivo },
            { n: 'Digital', v: digital, pc: pd, c: COLORES.digital },
          ].map((m) => (
            <div key={m.n}>
              <dt className="flex items-center gap-1.5 text-sm text-suave">
                <span
                  aria-hidden="true"
                  className="inline-block size-3 rounded-sm"
                  style={{ background: m.c }}
                />
                {m.n}
              </dt>
              <dd className="text-2xl font-semibold">
                {formatearPorcentaje(m.pc, { conSigno: false })}
              </dd>
              <dd className="text-sm text-suave cifras">{p(m.v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </TarjetaGrafico>
  )
}

// ---------------------------------------------------------------------------
// ¿Qué días de la semana se vende más?
// ---------------------------------------------------------------------------
export function GraficoDiasSemana({
  datos,
  cargando,
}: {
  datos: VentasDiaSemana[]
  cargando?: boolean
}) {
  const filas = datos.map((d) => ({ ...d, nombre: NOMBRES_DIA_SEMANA[d.dia_semana - 1] ?? '' }))
  const max = Math.max(0, ...filas.map((f) => f.promedio))
  const min = Math.min(...filas.map((f) => f.promedio))
  const mejor = filas.find((f) => f.promedio === max)
  const peor = filas.find((f) => f.promedio === min)
  return (
    <TarjetaGrafico
      titulo="Días de la semana"
      subtitulo={
        mejor && peor
          ? `Promedio por día. Más fuerte: ${mejor.nombre}. Más flojo: ${peor.nombre}.`
          : 'Promedio por día'
      }
      cargando={cargando}
      tabla={
        <TablaDatos
          columnas={['Día', 'Promedio', 'Días trabajados', 'Total']}
          filas={filas.map((f) => [f.nombre, p(f.promedio), f.dias_trabajados, p(f.total)])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={filas.length * 36 + 16}>
        <BarChart data={filas} layout="vertical" margin={{ top: 0, right: 88, left: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="nombre" {...EJE} axisLine={false} width={84} />
          <Tooltip cursor={{ fill: COLORES.grilla, opacity: 0.6 }} content={<TooltipPesos />} />
          <Bar
            dataKey="promedio"
            name="Promedio"
            fill={COLORES.ingresos}
            maxBarSize={BARRA_MAX}
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              dataKey="promedio"
              position="right"
              formatter={(v) => formatearPesosCompacto(Number(v))}
              fill={COLORES.suave}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </TarjetaGrafico>
  )
}

// ---------------------------------------------------------------------------
// ¿Cuánto entra, cuánto sale y cuánto queda? (estimación)
// ---------------------------------------------------------------------------
export function GraficoIngresosEgresos({
  datos,
  cargando,
}: {
  datos: IngresosEgresosMes[]
  cargando?: boolean
}) {
  return (
    <TarjetaGrafico
      titulo="Ingresos, egresos y ganancia aproximada"
      subtitulo="Estimación: ventas − egresos − personal. No incluye mercadería en stock, deudas ni impuestos no cargados."
      leyenda={[
        { color: COLORES.ingresos, texto: 'Ingresos (ventas)' },
        { color: COLORES.egresos, texto: 'Egresos' },
        { color: COLORES.personal, texto: 'Personal' },
        { color: COLORES.texto, texto: 'Ganancia aprox.', forma: 'linea' },
      ]}
      cargando={cargando}
      tabla={
        <TablaDatos
          columnas={['Mes', 'Ingresos', 'Egresos', 'Personal', 'Ganancia aprox.']}
          filas={datos.map((d) => [
            nombreMes(d.mes),
            p(d.ingresos),
            p(d.egresos),
            p(d.personal),
            p(d.ganancia),
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={ALTO + 20}>
        <ComposedChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={COLORES.grilla} />
          <XAxis dataKey="mes" tickFormatter={nombreMes} {...EJE} />
          <YAxis tickFormatter={formatearPesosCompacto} {...EJE} axisLine={false} width={64} />
          <ReferenceLine y={0} stroke={COLORES.suave} />
          <Tooltip
            cursor={{ fill: COLORES.grilla, opacity: 0.6 }}
            content={<TooltipPesos formatoEtiqueta={nombreMes} />}
          />
          <Bar
            dataKey="ingresos"
            name="Ingresos"
            fill={COLORES.ingresos}
            maxBarSize={BARRA_MAX}
            radius={PUNTA}
          />
          <Bar
            dataKey="egresos"
            name="Egresos"
            fill={COLORES.egresos}
            maxBarSize={BARRA_MAX}
            radius={PUNTA}
          />
          <Bar
            dataKey="personal"
            name="Personal"
            fill={COLORES.personal}
            maxBarSize={BARRA_MAX}
            radius={PUNTA}
          />
          <Line
            dataKey="ganancia"
            name="Ganancia aprox."
            stroke={COLORES.texto}
            strokeWidth={2}
            dot={{ r: 4, fill: COLORES.texto, stroke: COLORES.superficie, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </TarjetaGrafico>
  )
}

// ---------------------------------------------------------------------------
// ¿En qué se va la plata?
// ---------------------------------------------------------------------------
export function GraficoEgresosCategoria({
  datos,
  cargando,
}: {
  datos: EgresosCategoria[]
  cargando?: boolean
}) {
  const total = datos.reduce((s, d) => s + d.total, 0)
  return (
    <TarjetaGrafico
      titulo="Egresos por categoría"
      subtitulo={`Total del período: ${p(total)}`}
      cargando={cargando}
      tabla={
        <TablaDatos
          columnas={['Categoría', 'Total', 'Cantidad', '% del total']}
          filas={datos.map((d) => [
            d.categoria,
            p(d.total),
            d.cantidad,
            formatearPorcentaje(total ? (d.total / total) * 100 : 0, { conSigno: false }),
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={Math.max(1, datos.length) * 36 + 16}>
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 88, left: 0, bottom: 0 }}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis type="category" dataKey="categoria" {...EJE} axisLine={false} width={104} />
          <Tooltip cursor={{ fill: COLORES.grilla, opacity: 0.6 }} content={<TooltipPesos />} />
          <Bar
            dataKey="total"
            name="Total"
            fill={COLORES.egresos}
            maxBarSize={BARRA_MAX}
            radius={[0, 4, 4, 0]}
          >
            <LabelList
              dataKey="total"
              position="right"
              formatter={(v) => formatearPesosCompacto(Number(v))}
              fill={COLORES.suave}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </TarjetaGrafico>
  )
}
