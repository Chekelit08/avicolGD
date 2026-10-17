export const COLORES = {
  efectivo: 'var(--grafico-efectivo)',
  digital: 'var(--grafico-digital)',
  ingresos: 'var(--grafico-ingresos)',
  egresos: 'var(--grafico-egresos)',
  personal: 'var(--grafico-personal)',
  grilla: 'var(--grafico-grilla)',
  texto: 'var(--texto)',
  suave: 'var(--texto-suave)',
  superficie: 'var(--superficie)',
} as const

export const EJE = {
  tick: { fill: COLORES.suave, fontSize: 12 },
  axisLine: { stroke: COLORES.grilla },
  tickLine: false,
} as const
