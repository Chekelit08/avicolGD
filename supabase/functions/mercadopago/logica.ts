// Reglas de la integración con Mercado Pago, sin dependencias de Deno (se prueban con Vitest).

/** Lo que nos importa de un pago de la API de Mercado Pago (GET /v1/payments/:id). */
export interface PagoMp {
  id: number | string
  status: string
  transaction_amount: number
  date_approved?: string | null
  date_created: string
  operation_type?: string | null
  payment_type_id?: string | null
  description?: string | null
  collector_id?: number | null
  payer?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null
}

/** Argumentos de la función SQL registrar_cobro_mp. */
export interface CobroParaRegistrar {
  p_id_mp: string
  p_importe: number
  p_pagado_en: string
  p_tipo: string | null
  p_descripcion: string | null
  p_pagador: string | null
}

/** Plata que entra a la cuenta pero no es una venta (por ejemplo, cargar saldo propio). */
const OPERACIONES_QUE_NO_SON_VENTAS = new Set(['account_fund', 'money_exchange'])

/**
 * Convierte un pago de MP en un cobro para la caja, o null si no corresponde:
 * tiene que estar aprobado, ser plata que recibió la cuenta del local y no una carga de saldo.
 */
export function cobroDesdePago(pago: PagoMp, miCuenta: number | null): CobroParaRegistrar | null {
  if (pago.status !== 'approved') return null
  if (!(pago.transaction_amount > 0)) return null
  if (miCuenta !== null && pago.collector_id != null && pago.collector_id !== miCuenta) return null
  if (pago.operation_type && OPERACIONES_QUE_NO_SON_VENTAS.has(pago.operation_type)) return null

  const nombre = [pago.payer?.first_name, pago.payer?.last_name].filter(Boolean).join(' ').trim()
  return {
    p_id_mp: String(pago.id),
    p_importe: Math.round(pago.transaction_amount * 100) / 100,
    p_pagado_en: pago.date_approved ?? pago.date_created,
    p_tipo: pago.operation_type ?? pago.payment_type_id ?? null,
    p_descripcion: pago.description ?? null,
    p_pagador: nombre || pago.payer?.email || null,
  }
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function igualesSinFiltrarTiempo(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let distinto = 0
  for (let i = 0; i < a.length; i++) distinto |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return distinto === 0
}

/**
 * Verifica el header x-signature de un webhook de Mercado Pago ("ts=…,v1=…").
 * v1 = HMAC-SHA256 (hex) con la clave secreta sobre "id:<data.id>;request-id:<x-request-id>;ts:<ts>;".
 * Las partes que no vienen en la notificación se omiten; data.id alfanumérico va en minúsculas.
 */
export async function firmaValida({
  xSignature,
  xRequestId,
  dataId,
  secreto,
}: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
  secreto: string
}): Promise<boolean> {
  if (!xSignature || !secreto) return false
  const partes = Object.fromEntries(
    xSignature.split(',').map((p) => {
      const [clave, ...valor] = p.split('=')
      return [clave.trim(), valor.join('=').trim()]
    }),
  )
  const ts = partes.ts
  const v1 = partes.v1
  if (!ts || !v1) return false

  let manifiesto = ''
  if (dataId) manifiesto += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`
  if (xRequestId) manifiesto += `request-id:${xRequestId};`
  manifiesto += `ts:${ts};`

  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const firma = hex(await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(manifiesto)))
  return igualesSinFiltrarTiempo(firma, v1.toLowerCase())
}

export function secretosIguales(a: string | null, b: string): boolean {
  return Boolean(a) && Boolean(b) && igualesSinFiltrarTiempo(a ?? '', b)
}
