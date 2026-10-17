import { describe, expect, it } from 'vitest'
import { armarResumen, cifrasPrincipales, nombreArchivo } from './resumenMensual'

const ventas = {
  desde: '2026-10-01',
  hasta: '2026-10-31',
  total: 1_000_000,
  total_efectivo: 600_000,
  total_digital: 400_000,
  cantidad_ventas: 100,
  ticket_promedio: 10_000,
  dias_trabajados: 4,
  promedio_diario: 250_000,
  diferencia_caja: -500,
  mejor_dia: '2026-10-03',
  mejor_dia_total: 300_000,
}

describe('armarResumen', () => {
  const r = armarResumen({
    titulo: 'octubre de 2026',
    desde: '2026-10-01',
    hasta: '2026-10-31',
    ventas,
    dias: [],
    egresos: [],
    egresosCategoria: [
      { categoria_id: 'a', categoria: 'Mercadería', total: 500_000, cantidad: 2 },
      { categoria_id: 'b', categoria: 'Alquiler', total: 200_000, cantidad: 1 },
    ],
    personal: [
      {
        empleado_id: 'e',
        nombre: 'Marcos',
        activo: true,
        sueldo: 150_000,
        adelanto: 0,
        aguinaldo: 0,
        otro: 0,
        total: 150_000,
      },
    ],
  })

  it('calcula el resultado aproximado: ventas − egresos − personal', () => {
    expect(r.totalEgresos).toBe(700_000)
    expect(r.totalPersonal).toBe(150_000)
    expect(r.ganancia).toBe(150_000)
  })
  it('las cifras principales empiezan por las ventas y terminan en el resultado', () => {
    const cifras = cifrasPrincipales(r)
    expect(cifras[0]?.[0]).toBe('Ventas totales')
    expect(cifras.at(-1)?.[0]).toBe('Resultado aproximado')
  })
  it('nombra el archivo con el mes', () => {
    expect(nombreArchivo(r, 'xlsx')).toBe('avicola-gd-resumen-2026-10.xlsx')
  })
})
