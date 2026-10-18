// Edge Function: cobros de Mercado Pago que se cargan solos en la caja.
// Sin dependencias: habla directo con la API de Mercado Pago y con la base (REST + clave de servicio).
//
// Tres formas de llamarla:
//   1. Webhook de Mercado Pago (header x-signature): avisa que hubo un pago → se busca y se registra.
//   2. Barrido de respaldo (header x-barrido, lo manda pg_cron cada 5 minutos): revisa las últimas horas.
//   3. Desde la app, un admin (Authorization: Bearer <sesión>):
//        { accion: 'estado' }  → si está conectada y a qué cuenta
//        { accion: 'barrer' }  → revisa los últimos 2 días ahora
//
// Secretos (solo en Supabase, nunca en el repo): MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, BARRIDO_SECRETO.

import { cobroDesdePago, firmaValida, secretosIguales, type PagoMp } from './logica.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function respuesta(cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const error = (mensaje: string, estado = 400) => respuesta({ error: mensaje }, estado)

const URL_BASE = Deno.env.get('SUPABASE_URL') ?? ''
const CLAVE_SERVICIO = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const TOKEN_MP = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const SECRETO_WEBHOOK = Deno.env.get('MP_WEBHOOK_SECRET') ?? ''
const SECRETO_BARRIDO = Deno.env.get('BARRIDO_SECRETO') ?? ''
// Solo para pruebas locales contra un Mercado Pago simulado.
const API_MP = Deno.env.get('MP_API_URL') ?? 'https://api.mercadopago.com'

async function base(ruta: string, opciones: RequestInit = {}) {
  const res = await fetch(`${URL_BASE}${ruta}`, {
    ...opciones,
    headers: {
      apikey: CLAVE_SERVICIO,
      Authorization: `Bearer ${CLAVE_SERVICIO}`,
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  })
  const texto = await res.text()
  return { ok: res.ok, estado: res.status, json: texto ? JSON.parse(texto) : null }
}

async function mp<T>(ruta: string): Promise<T> {
  const res = await fetch(`${API_MP}${ruta}`, { headers: { Authorization: `Bearer ${TOKEN_MP}` } })
  if (!res.ok) throw new Error(`Mercado Pago respondió ${res.status} en ${ruta.split('?')[0]}`)
  return (await res.json()) as T
}

let cuenta: { id: number; nickname?: string } | null = null
async function miCuenta() {
  cuenta ??= await mp<{ id: number; nickname?: string }>('/users/me')
  return cuenta
}

/** Registra un pago si es un cobro de la cuenta. Devuelve true si es nuevo. */
async function registrar(pago: PagoMp): Promise<boolean> {
  const cobro = cobroDesdePago(pago, (await miCuenta()).id)
  if (!cobro) return false
  const ya = await base(
    `/rest/v1/cobros_mp?id_mp=eq.${encodeURIComponent(cobro.p_id_mp)}&select=id`,
  )
  if (ya.ok && Array.isArray(ya.json) && ya.json.length > 0) return false
  // registrar_cobro_mp es idempotente: si dos avisos llegan juntos, queda uno solo.
  const r = await base('/rest/v1/rpc/registrar_cobro_mp', {
    method: 'POST',
    body: JSON.stringify(cobro),
  })
  if (!r.ok)
    throw new Error(`No se pudo registrar el cobro ${cobro.p_id_mp}: ${JSON.stringify(r.json)}`)
  return true
}

async function barrer(horas: number) {
  const { id } = await miCuenta()
  const desde = new Date(Date.now() - horas * 3_600_000).toISOString()
  const hasta = new Date().toISOString()
  let revisados = 0
  let nuevos = 0
  for (let offset = 0; offset < 1000; offset += 100) {
    const pagina = await mp<{ results: PagoMp[]; paging?: { total?: number } }>(
      `/v1/payments/search?sort=date_created&criteria=desc&range=date_created` +
        `&begin_date=${encodeURIComponent(desde)}&end_date=${encodeURIComponent(hasta)}` +
        `&collector.id=${id}&limit=100&offset=${offset}`,
    )
    for (const pago of pagina.results ?? []) {
      revisados++
      if (await registrar(pago)) nuevos++
    }
    if ((pagina.results ?? []).length < 100) break
  }
  return { revisados, nuevos }
}

async function esAdmin(autorizacion: string) {
  if (!/^Bearer\s+\S+/i.test(autorizacion)) return false
  const quien = await base('/auth/v1/user', { headers: { Authorization: autorizacion } })
  const id = (quien.json as { id?: string } | null)?.id
  if (!quien.ok || !id) return false
  const perfil = await base(`/rest/v1/perfiles?id=eq.${id}&select=rol,activo`)
  const fila = (perfil.json as { rol: string; activo: boolean }[] | null)?.[0]
  return Boolean(fila && fila.rol === 'admin' && fila.activo)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return error('Método no permitido', 405)
  if (!URL_BASE || !CLAVE_SERVICIO) return error('La función no está configurada.', 500)

  const url = new URL(req.url)

  try {
    // 1. Webhook de Mercado Pago
    if (req.headers.has('x-signature')) {
      const cuerpo = (await req.json().catch(() => ({}))) as {
        type?: string
        data?: { id?: string }
      }
      const tipo = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? cuerpo.type
      const dataId =
        url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? cuerpo.data?.id
      const valida = await firmaValida({
        xSignature: req.headers.get('x-signature'),
        xRequestId: req.headers.get('x-request-id'),
        dataId: dataId ? String(dataId) : null,
        secreto: SECRETO_WEBHOOK,
      })
      if (!valida) return error('Firma inválida.', 401)
      if (!TOKEN_MP) return error('Falta el Access Token de Mercado Pago.', 503)
      if (tipo !== 'payment' || !dataId) return respuesta({ ignorado: true })
      if (!/^\d{1,20}$/.test(String(dataId))) return error('Pago inválido.')
      const pago = await mp<PagoMp>(`/v1/payments/${dataId}`)
      return respuesta({ nuevo: await registrar(pago) })
    }

    // 2. Barrido de respaldo (pg_cron)
    if (req.headers.has('x-barrido')) {
      if (!secretosIguales(req.headers.get('x-barrido'), SECRETO_BARRIDO))
        return error('No autorizado.', 401)
      if (!TOKEN_MP) return respuesta({ configurado: false })
      return respuesta(await barrer(3))
    }

    // 3. Un admin desde la app
    if (!(await esAdmin(req.headers.get('Authorization') ?? ''))) {
      return error('Esta acción es solo para administradores.', 403)
    }
    const cuerpo = (await req.json().catch(() => ({}))) as { accion?: string }
    if (!TOKEN_MP) return respuesta({ configurado: false })
    if (cuerpo.accion === 'estado') {
      const c = await miCuenta()
      return respuesta({ configurado: true, cuenta: c.nickname ?? String(c.id) })
    }
    if (cuerpo.accion === 'barrer') return respuesta({ configurado: true, ...(await barrer(48)) })
    return error('Acción desconocida.')
  } catch (e) {
    console.error(e)
    return error(
      e instanceof Error && e.message.startsWith('Mercado Pago respondió 401')
        ? 'Mercado Pago rechazó el Access Token. Revisá que sea el de producción.'
        : 'No pudimos hablar con Mercado Pago. Probá de nuevo en un rato.',
      502,
    )
  }
})
