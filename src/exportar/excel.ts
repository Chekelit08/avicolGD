import writeXlsxFile, { type SheetData } from 'write-excel-file/browser'
import { leerFecha } from '../lib/periodos'
import { nombreArchivo, NOTA_ESTIMACION, type ResumenMensual } from './resumenMensual'

const PESOS = '"$" #,##0.00'
const FECHA = 'dd/mm/yyyy'
const titulo = (t: string) => ({ value: t, fontWeight: 'bold' as const })
const pesos = (n: number) => ({ value: n, format: PESOS })
const fecha = (f: string) => ({ value: leerFecha(f), format: FECHA, type: Date })

/** Resumen mensual en Excel: una hoja por tema, con montos como números (para sumar). */
export async function descargarExcel(r: ResumenMensual): Promise<void> {
  const resumen: SheetData = [
    [titulo(`Avícola GD — Resumen de ${r.titulo}`)],
    [],
    [titulo('Concepto'), titulo('Monto')],
    ['Ventas totales', pesos(r.ventas.total)],
    ['Ventas en efectivo', pesos(r.ventas.total_efectivo)],
    ['Ventas digitales', pesos(r.ventas.total_digital)],
    ['Cantidad de ventas', r.ventas.cantidad_ventas],
    ['Ticket promedio', pesos(r.ventas.ticket_promedio)],
    ['Días trabajados', r.ventas.dias_trabajados],
    ['Diferencia de caja acumulada', pesos(r.ventas.diferencia_caja)],
    ['Egresos', pesos(r.totalEgresos)],
    ['Personal', pesos(r.totalPersonal)],
    [titulo('Resultado aproximado'), { ...pesos(r.ganancia), fontWeight: 'bold' }],
    [],
    [NOTA_ESTIMACION],
  ]

  const dias: SheetData = [
    [
      titulo('Fecha'),
      titulo('Efectivo'),
      titulo('Digital'),
      titulo('Total'),
      titulo('Ventas'),
      titulo('Estado'),
    ],
    ...r.dias.map((d) => [
      fecha(d.fecha),
      pesos(d.total_efectivo),
      pesos(d.total_digital),
      pesos(d.total),
      d.cantidad_ventas,
      d.trabajado ? 'Abierto' : 'Cerrado',
    ]),
  ]

  const egresos: SheetData = [
    [
      titulo('Fecha'),
      titulo('Categoría'),
      titulo('Detalle'),
      titulo('Proveedor'),
      titulo('Medio'),
      titulo('Monto'),
    ],
    ...r.egresos.map((e) => [
      fecha(e.fecha),
      e.categoria,
      e.descripcion,
      e.proveedor,
      e.medio,
      pesos(e.monto),
    ]),
  ]

  const personal: SheetData = [
    [
      titulo('Empleado'),
      titulo('Sueldo'),
      titulo('Adelantos'),
      titulo('Aguinaldo'),
      titulo('Otros'),
      titulo('Total'),
    ],
    ...r.personal.map((e) => [
      e.nombre,
      pesos(e.sueldo),
      pesos(e.adelanto),
      pesos(e.aguinaldo),
      pesos(e.otro),
      pesos(e.total),
    ]),
  ]

  await writeXlsxFile([
    { data: resumen, sheet: 'Resumen', columns: [{ width: 36 }, { width: 18 }] },
    {
      data: dias,
      sheet: 'Ventas por día',
      columns: [
        { width: 12 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 8 },
        { width: 10 },
      ],
      stickyRowsCount: 1,
    },
    {
      data: egresos,
      sheet: 'Egresos',
      columns: [
        { width: 12 },
        { width: 16 },
        { width: 32 },
        { width: 22 },
        { width: 10 },
        { width: 16 },
      ],
      stickyRowsCount: 1,
    },
    {
      data: personal,
      sheet: 'Personal',
      columns: [
        { width: 24 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
      ],
      stickyRowsCount: 1,
    },
  ]).toFile(nombreArchivo(r, 'xlsx'))
}
