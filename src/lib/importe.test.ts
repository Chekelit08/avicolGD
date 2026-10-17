import { describe, expect, it } from 'vitest'
import { aplicarTecla, IMPORTE_MAXIMO, teclaDesdeTeclado } from './importe'

describe('aplicarTecla', () => {
  it('agrega dígitos a la derecha', () => {
    expect(aplicarTecla(0, '1')).toBe(1)
    expect(aplicarTecla(12, '5')).toBe(125)
  })
  it('la tecla 000 multiplica por mil', () => {
    expect(aplicarTecla(12, '000')).toBe(12000)
  })
  it('un cero inicial no suma nada', () => {
    expect(aplicarTecla(0, '0')).toBe(0)
    expect(aplicarTecla(0, '000')).toBe(0)
  })
  it('borrar saca el último dígito', () => {
    expect(aplicarTecla(12500, 'borrar')).toBe(1250)
    expect(aplicarTecla(0, 'borrar')).toBe(0)
  })
  it('no pasa del máximo del visor', () => {
    expect(aplicarTecla(IMPORTE_MAXIMO, '9')).toBe(IMPORTE_MAXIMO)
    expect(aplicarTecla(12345, '000')).toBe(12345)
  })
})

describe('teclaDesdeTeclado', () => {
  it('reconoce dígitos y borrar', () => {
    expect(teclaDesdeTeclado('7')).toBe('7')
    expect(teclaDesdeTeclado('Backspace')).toBe('borrar')
    expect(teclaDesdeTeclado('a')).toBeNull()
  })
})
