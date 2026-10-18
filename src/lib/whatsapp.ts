import { formatearPesos } from './formato'

/**
 * Número de WhatsApp de Argentina para wa.me: 549 + característica + número (sin 0 ni 15).
 * Acepta "11 2233 4455", "011 2233-4455", "+54 9 11 2233 4455". Devuelve null si no se entiende.
 */
export function normalizarWhatsapp(texto: string): string | null {
  let d = texto.replace(/\D/g, '')
  if (d.startsWith('549') && d.length === 13) return d
  if (d.startsWith('54') && d.length === 12) return `549${d.slice(2)}`
  if (d.startsWith('0')) d = d.slice(1)
  if (d.length === 10) return `549${d}`
  return null
}

export interface DatosResumen {
  fecha: string
  total: number
  cantidad_ventas: number
  total_efectivo: number
  total_digital: number
  total_mercadopago: number
  total_salidas: number
  efectivo_esperado: number
  efectivo_contado: number | null
  diferencia_efectivo: number | null
  nota?: string | null
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** El texto que se manda por WhatsApp al cerrar el día. */
export function textoResumen(r: DatosResumen): string {
  const p = (n: number) => formatearPesos(n, { sinCentavos: n % 1 === 0 })
  const [anio, mes, dia] = r.fecha.split('-')
  const nombreDia = DIAS[new Date(Number(anio), Number(mes) - 1, Number(dia)).getDay()]
  const lineas = [
    `*Avícola GD · cierre del ${nombreDia} ${dia}/${mes}*`,
    `Total: *${p(r.total)}* (${r.cantidad_ventas} ${r.cantidad_ventas === 1 ? 'venta' : 'ventas'})`,
    `• Efectivo: ${p(r.total_efectivo)}`,
    `• Digital: ${p(r.total_digital)}` +
      (r.total_mercadopago > 0 ? ` (Mercado Pago: ${p(r.total_mercadopago)})` : ''),
  ]
  if (r.total_salidas > 0) lineas.push(`Salidas de caja: − ${p(r.total_salidas)}`)
  if (r.efectivo_contado !== null) {
    lineas.push(`Efectivo esperado: ${p(r.efectivo_esperado)} · contado: ${p(r.efectivo_contado)}`)
  }
  if (r.diferencia_efectivo !== null) {
    const dif = r.diferencia_efectivo
    lineas.push(
      dif === 0
        ? 'La caja coincide ✅'
        : `${dif > 0 ? 'Sobran' : 'Faltan'} ${p(Math.abs(dif))} ${dif > 0 ? '⚠️' : '❗'}`,
    )
  }
  if (r.nota) lineas.push(`Nota: ${r.nota}`)
  return lineas.join('\n')
}

export function enlaceWhatsapp(numero: string | null | undefined, texto: string): string {
  return `https://wa.me/${numero ?? ''}?text=${encodeURIComponent(texto)}`
}
