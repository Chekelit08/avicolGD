import { exigir } from '../datos/caja'
import type {
  EgresosCategoria,
  FacturacionDia,
  PersonalMes,
  ResumenPeriodo,
} from '../datos/reportes'
import { fechaDeTrabajo, formatearPesos } from '../lib/formato'
import { diaSemanaCorto, fechaLarga, hastaHoy, periodo } from '../lib/periodos'
import { supabase } from '../lib/supabase'

export interface EgresoDetalle {
  fecha: string
  categoria: string
  descripcion: string
  proveedor: string
  medio: string
  monto: number
}

export interface ResumenMensual {
  titulo: string
  desde: string
  hasta: string
  generado: Date
  ventas: ResumenPeriodo
  dias: FacturacionDia[]
  egresosCategoria: EgresosCategoria[]
  egresos: EgresoDetalle[]
  personal: PersonalMes[]
  totalEgresos: number
  totalPersonal: number
  ganancia: number
}

/** Junta todo lo que el contador necesita de un mes. Lo calcula la base. */
export async function cargarResumenMensual(fechaDelMes: string): Promise<ResumenMensual> {
  // El mes en curso se corta en hoy: los días que todavía no pasaron no figuran como "cerrado".
  const per = hastaHoy(periodo('mes', fechaDelMes), fechaDeTrabajo(new Date()))
  const rango = { p_desde: per.desde, p_hasta: per.hasta }
  const cliente = supabase()
  const [ventas, dias, porCategoria, egresos, personal] = await Promise.all([
    cliente.rpc('resumen_periodo', rango),
    cliente.rpc('facturacion_por_dia', rango),
    cliente.rpc('egresos_por_categoria', rango),
    cliente
      .from('egresos')
      .select(
        'fecha, descripcion, proveedor, monto, medio_pago, categoria:categorias_egreso(nombre)',
      )
      .eq('anulado', false)
      .gte('fecha', per.desde)
      .lte('fecha', per.hasta)
      .order('fecha'),
    cliente.rpc('personal_del_mes', { p_periodo: per.desde }),
  ])

  const resumenVentas = exigir(ventas)[0]
  if (!resumenVentas) throw new Error('No se pudo calcular el resumen del mes.')
  return armarResumen({
    titulo: per.titulo,
    desde: per.desde,
    hasta: per.hasta,
    ventas: resumenVentas,
    dias: exigir(dias),
    egresosCategoria: exigir(porCategoria),
    egresos: exigir(egresos).map((e) => ({
      fecha: e.fecha,
      categoria: e.categoria?.nombre ?? '',
      descripcion: e.descripcion,
      proveedor: e.proveedor ?? '',
      medio: e.medio_pago === 'efectivo' ? 'Efectivo' : 'Digital',
      monto: e.monto,
    })),
    personal: exigir(personal),
  })
}

export function armarResumen(
  datos: Omit<ResumenMensual, 'generado' | 'totalEgresos' | 'totalPersonal' | 'ganancia'>,
): ResumenMensual {
  const totalEgresos = datos.egresosCategoria.reduce((s, c) => s + c.total, 0)
  const totalPersonal = datos.personal.reduce((s, p) => s + p.total, 0)
  return {
    ...datos,
    generado: new Date(),
    totalEgresos,
    totalPersonal,
    ganancia: datos.ventas.total - totalEgresos - totalPersonal,
  }
}

const p = (n: number) => formatearPesos(n)

/** Las cifras principales, en el orden en que las lee el contador. */
export function cifrasPrincipales(r: ResumenMensual): [string, string][] {
  return [
    ['Ventas totales', p(r.ventas.total)],
    ['Ventas en efectivo', p(r.ventas.total_efectivo)],
    ['Ventas digitales', p(r.ventas.total_digital)],
    ['Cantidad de ventas', String(r.ventas.cantidad_ventas)],
    ['Ticket promedio', p(r.ventas.ticket_promedio)],
    ['Días trabajados', String(r.ventas.dias_trabajados)],
    ['Diferencia de caja acumulada', p(r.ventas.diferencia_caja)],
    ['Egresos', p(r.totalEgresos)],
    ['Personal (sueldos, adelantos, aguinaldo)', p(r.totalPersonal)],
    ['Resultado aproximado', p(r.ganancia)],
  ]
}

export const NOTA_ESTIMACION =
  'El resultado es una estimación: ventas menos egresos y pagos al personal cargados en la app. ' +
  'No incluye mercadería en stock, deudas, ni impuestos que no se hayan cargado como egreso.'

export function filasDias(r: ResumenMensual): string[][] {
  return r.dias.map((d) =>
    d.trabajado
      ? [
          diaSemanaCorto(d.fecha),
          p(d.total_efectivo),
          p(d.total_digital),
          p(d.total),
          String(d.cantidad_ventas),
        ]
      : [diaSemanaCorto(d.fecha), 'Cerrado', '', '', ''],
  )
}

export function nombreArchivo(r: ResumenMensual, extension: 'pdf' | 'xlsx'): string {
  return `avicola-gd-resumen-${r.desde.slice(0, 7)}.${extension}`
}

export { fechaLarga }
