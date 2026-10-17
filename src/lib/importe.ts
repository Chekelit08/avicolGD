/**
 * Importe que se tipea en el teclado de la caja, en pesos enteros (sin centavos, ver DECISIONES.md).
 * El visor tiene 7 dígitos, como una balanza: el máximo es $ 9.999.999.
 */
export const DIGITOS_VISOR = 7
export const IMPORTE_MAXIMO = 10 ** DIGITOS_VISOR - 1

export type Tecla = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '000' | 'borrar'

/** Aplica una tecla al importe actual. Si el resultado no entra en el visor, lo deja como estaba. */
export function aplicarTecla(importe: number, tecla: Tecla): number {
  if (tecla === 'borrar') return Math.floor(importe / 10)
  const siguiente = Number(`${importe}${tecla}`)
  return siguiente > IMPORTE_MAXIMO ? importe : siguiente
}

/** Mapea el teclado físico a teclas del visor. Devuelve null si la tecla no corresponde. */
export function teclaDesdeTeclado(key: string): Tecla | null {
  if (/^[0-9]$/.test(key)) return key as Tecla
  if (key === 'Backspace') return 'borrar'
  return null
}
