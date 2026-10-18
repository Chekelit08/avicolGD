import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { cobroDesdePago, firmaValida, secretosIguales, type PagoMp } from './logica'

const pago = (extra: Partial<PagoMp> = {}): PagoMp => ({
  id: 123456789,
  status: 'approved',
  transaction_amount: 8000,
  date_approved: '2026-10-18T12:04:00.000-03:00',
  date_created: '2026-10-18T12:03:50.000-03:00',
  operation_type: 'regular_payment',
  payment_type_id: 'account_money',
  description: 'Pago QR',
  collector_id: 555,
  payer: { first_name: 'Ana', last_name: 'Gómez', email: 'ana@example.com' },
  ...extra,
})

describe('cobroDesdePago', () => {
  it('un pago aprobado a la cuenta del local es un cobro', () => {
    expect(cobroDesdePago(pago(), 555)).toEqual({
      p_id_mp: '123456789',
      p_importe: 8000,
      p_pagado_en: '2026-10-18T12:04:00.000-03:00',
      p_tipo: 'regular_payment',
      p_descripcion: 'Pago QR',
      p_pagador: 'Ana Gómez',
    })
  })
  it('las transferencias recibidas también entran', () => {
    expect(cobroDesdePago(pago({ operation_type: 'money_transfer' }), 555)).not.toBeNull()
  })
  it('no toma pagos pendientes, rechazados ni devueltos', () => {
    for (const status of ['pending', 'in_process', 'rejected', 'refunded', 'cancelled'])
      expect(cobroDesdePago(pago({ status }), 555)).toBeNull()
  })
  it('no toma lo que paga la cuenta ni la carga de saldo propia', () => {
    expect(cobroDesdePago(pago({ collector_id: 999 }), 555)).toBeNull()
    expect(cobroDesdePago(pago({ operation_type: 'account_fund' }), 555)).toBeNull()
  })
  it('sin nombre usa el email; sin fecha de aprobación usa la de creación', () => {
    const c = cobroDesdePago(pago({ payer: { email: 'x@y.com' }, date_approved: null }), 555)
    expect(c?.p_pagador).toBe('x@y.com')
    expect(c?.p_pagado_en).toBe('2026-10-18T12:03:50.000-03:00')
  })
  it('redondea a centavos', () => {
    expect(cobroDesdePago(pago({ transaction_amount: 1234.567 }), 555)?.p_importe).toBe(1234.57)
  })
})

describe('firmaValida', () => {
  const secreto = 'secreto-de-prueba'
  const firmar = (manifiesto: string) =>
    createHmac('sha256', secreto).update(manifiesto).digest('hex')

  it('acepta la firma de Mercado Pago', async () => {
    const v1 = firmar('id:123456789;request-id:abc-123;ts:1729263840;')
    expect(
      await firmaValida({
        xSignature: `ts=1729263840,v1=${v1}`,
        xRequestId: 'abc-123',
        dataId: '123456789',
        secreto,
      }),
    ).toBe(true)
  })
  it('pasa a minúsculas un data.id alfanumérico', async () => {
    const v1 = firmar('id:abc9;ts:1;')
    expect(
      await firmaValida({ xSignature: `ts=1,v1=${v1}`, xRequestId: null, dataId: 'ABC9', secreto }),
    ).toBe(true)
  })
  it('rechaza firmas cambiadas, sin firma o con otra clave', async () => {
    const v1 = firmar('id:1;request-id:r;ts:1;')
    const base = { xRequestId: 'r', dataId: '1', secreto }
    expect(await firmaValida({ ...base, xSignature: `ts=2,v1=${v1}` })).toBe(false)
    expect(await firmaValida({ ...base, dataId: '2', xSignature: `ts=1,v1=${v1}` })).toBe(false)
    expect(await firmaValida({ ...base, xSignature: null })).toBe(false)
    expect(await firmaValida({ ...base, secreto: 'otra', xSignature: `ts=1,v1=${v1}` })).toBe(false)
  })
})

describe('secretosIguales', () => {
  it('compara el secreto del barrido', () => {
    expect(secretosIguales('abc', 'abc')).toBe(true)
    expect(secretosIguales('abd', 'abc')).toBe(false)
    expect(secretosIguales(null, 'abc')).toBe(false)
    expect(secretosIguales('', '')).toBe(false)
  })
})
