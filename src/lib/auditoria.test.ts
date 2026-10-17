import { describe, expect, it } from 'vitest'
import { describir } from './auditoria'

const base = { usuario_nombre: 'Gabriel', created_at: '2026-10-12T21:42:00Z' }

describe('describir', () => {
  it('reapertura legible', () => {
    expect(
      describir({
        ...base,
        accion: 'reabrir_jornada',
        antes: null,
        despues: { fecha: '2026-10-12' },
      }),
    ).toEqual({
      frase: 'Gabriel reabrió el 12/10',
      cuando: '12/10 — 18:42',
    })
  })
  it('anulación con monto y motivo', () => {
    const { frase } = describir({
      ...base,
      accion: 'anular_venta',
      antes: null,
      despues: { importe: 12500, motivo_anulacion: 'Error de tipeo' },
    })
    expect(frase).toMatch(/^Gabriel anuló una venta de \$\s12\.500 \(Error de tipeo\)$/)
  })
  it('cierre con faltante', () => {
    const { frase } = describir({
      ...base,
      accion: 'cerrar_jornada',
      antes: null,
      despues: { fecha: '2026-10-12', diferencia_efectivo: -500 },
    })
    expect(frase).toMatch(/cerró el día 12\/10 con \$\s500 de menos$/)
  })
  it('sin usuario lo atribuye al sistema', () => {
    expect(
      describir({
        ...base,
        usuario_nombre: null,
        accion: 'restablecer_clave',
        antes: null,
        despues: null,
      }).frase,
    ).toBe('El sistema restableció una contraseña')
  })
})
