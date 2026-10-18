import { describe, expect, it } from 'vitest'
import { enlaceWhatsapp, normalizarWhatsapp, textoResumen, type DatosResumen } from './whatsapp'

describe('normalizarWhatsapp', () => {
  it('arma el número para wa.me', () => {
    expect(normalizarWhatsapp('11 2233 4455')).toBe('5491122334455')
    expect(normalizarWhatsapp('011 2233-4455')).toBe('5491122334455')
    expect(normalizarWhatsapp('+54 9 11 2233 4455')).toBe('5491122334455')
    expect(normalizarWhatsapp('+54 11 2233 4455')).toBe('5491122334455')
    expect(normalizarWhatsapp('0351 455-6677')).toBe('5493514556677')
  })
  it('rechaza lo que no entiende', () => {
    expect(normalizarWhatsapp('')).toBeNull()
    expect(normalizarWhatsapp('2233 4455')).toBeNull()
    expect(normalizarWhatsapp('11 15 2233 4455')).toBeNull()
  })
})

const base: DatosResumen = {
  fecha: '2026-10-17',
  total: 245_300,
  cantidad_ventas: 87,
  total_efectivo: 120_000,
  total_digital: 125_300,
  total_mercadopago: 80_000,
  total_salidas: 30_000,
  efectivo_esperado: 100_000,
  efectivo_contado: 99_500,
  diferencia_efectivo: -500,
  nota: 'Faltó cambio',
}

describe('textoResumen', () => {
  it('resume el día con lo que importa', () => {
    const t = textoResumen(base)
    expect(t).toContain('cierre del sábado 17/10')
    expect(t).toMatch(/Total: \*\$\s245\.300\* \(87 ventas\)/)
    expect(t).toMatch(/Mercado Pago: \$\s80\.000/)
    expect(t).toMatch(/Salidas de caja: − \$\s30\.000/)
    expect(t).toMatch(/Faltan \$\s500/)
    expect(t).toContain('Nota: Faltó cambio')
  })
  it('sin Mercado Pago ni salidas no las menciona', () => {
    const t = textoResumen({
      ...base,
      total_mercadopago: 0,
      total_salidas: 0,
      diferencia_efectivo: 0,
    })
    expect(t).not.toContain('Mercado Pago')
    expect(t).not.toContain('Salidas')
    expect(t).toContain('La caja coincide')
  })
})

describe('enlaceWhatsapp', () => {
  it('con número va directo; sin número deja elegir el contacto', () => {
    expect(enlaceWhatsapp('5491122334455', 'hola y chau')).toBe(
      'https://wa.me/5491122334455?text=hola%20y%20chau',
    )
    expect(enlaceWhatsapp(null, 'x')).toBe('https://wa.me/?text=x')
  })
})
