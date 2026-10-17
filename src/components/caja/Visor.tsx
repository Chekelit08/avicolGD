import { formatearPesos } from '../../lib/formato'
import { DIGITOS_VISOR } from '../../lib/importe'

/**
 * En DSEG7, `!` es un dígito con todos los segmentos apagados y `.` no ocupa ancho.
 * Así el importe queda alineado a la derecha sobre los segmentos "fantasma" 8.888.888.
 */
const FANTASMA = '8.888.888'

function segmentosEncendidos(importe: number): string {
  const digitos = String(importe)
  const vacios = DIGITOS_VISOR - digitos.length
  let texto = ''
  for (let i = 0; i < DIGITOS_VISOR; i++) {
    const encendido = i >= vacios
    texto += encendido ? digitos[i - vacios] : '!'
    const llevaPunto = (DIGITOS_VISOR - 1 - i) % 3 === 0 && i < DIGITOS_VISOR - 1
    if (llevaPunto && encendido) texto += '.'
  }
  return texto
}

export function Visor({ importe }: { importe: number }) {
  return (
    <div className="rounded-2xl border-2 border-visor-borde bg-visor px-4 pt-2 pb-3 shadow-[inset_0_4px_14px_rgb(0_0_0/0.6)]">
      <div className="text-xs font-bold tracking-[0.2em] text-fosforo/70" aria-hidden="true">
        IMPORTE
      </div>
      <output
        aria-live="off"
        aria-label={`Importe: ${formatearPesos(importe, { sinCentavos: true })}`}
        className="flex items-baseline justify-end gap-3"
      >
        <span className="text-3xl font-bold text-fosforo" aria-hidden="true">
          $
        </span>
        <span className="relative font-visor text-[clamp(2.25rem,11vw,3.5rem)] leading-none">
          <span className="absolute inset-0 text-right text-fosforo/[0.08]" aria-hidden="true">
            {FANTASMA}
          </span>
          <span
            className="relative text-fosforo [text-shadow:0_0_14px_rgb(124_245_200/0.45)]"
            aria-hidden="true"
          >
            {segmentosEncendidos(importe)}
          </span>
        </span>
      </output>
    </div>
  )
}
