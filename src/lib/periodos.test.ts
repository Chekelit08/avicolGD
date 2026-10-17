import { describe, expect, it } from 'vitest'
import { fechaCorta, moverPeriodo, periodo, ultimosDias } from './periodos'

describe('periodo', () => {
  it('la semana va de lunes a domingo y compara con la anterior', () => {
    const p = periodo('semana', '2026-10-17') // sábado
    expect(p.desde).toBe('2026-10-12')
    expect(p.hasta).toBe('2026-10-18')
    expect(p.anterior).toEqual({ desde: '2026-10-05', hasta: '2026-10-11' })
  })
  it('el mes compara con el mes calendario anterior', () => {
    const p = periodo('mes', '2026-03-31')
    expect(p).toMatchObject({ desde: '2026-03-01', hasta: '2026-03-31' })
    expect(p.anterior).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' })
    expect(p.titulo).toBe('marzo de 2026')
  })
  it('el día compara con el día anterior', () => {
    expect(periodo('dia', '2026-10-01').anterior.desde).toBe('2026-09-30')
  })
})

describe('moverPeriodo y rangos', () => {
  it('navega períodos', () => {
    expect(moverPeriodo('mes', '2026-01-31', -1)).toBe('2025-12-31')
    expect(moverPeriodo('semana', '2026-10-17', 1)).toBe('2026-10-24')
  })
  it('últimos 30 días incluye hoy', () => {
    expect(ultimosDias('2026-10-17', 30)).toEqual({ desde: '2026-09-18', hasta: '2026-10-17' })
  })
  it('formatea dd/mm', () => {
    expect(fechaCorta('2026-10-05')).toBe('05/10')
  })
})
