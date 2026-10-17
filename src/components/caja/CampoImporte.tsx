import { forwardRef, type KeyboardEvent } from 'react'
import {
  accionDeTecla,
  formatearImporteEnCurso,
  normalizarImporte,
  type AccionTecla,
} from '../../lib/importe'

/**
 * Campo grande para tipear el importe con el teclado, al estilo de las pantallas de cobro
 * de Mercado Pago o Square. Solo acepta dígitos y los muestra con puntos de miles.
 * Enter, + y Esc se avisan con onAccion (no se escriben en el campo).
 */
export const CampoImporte = forwardRef<
  HTMLInputElement,
  {
    importe: number
    onCambio: (importe: number) => void
    onAccion?: (accion: Exclude<AccionTecla, null>) => void
    etiqueta: string
    deshabilitado?: boolean
    enfocar?: boolean
    describedBy?: string
  }
>(function CampoImporte(
  { importe, onCambio, onAccion, etiqueta, deshabilitado, enfocar, describedBy },
  ref,
) {
  const alPresionar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const accion = accionDeTecla(e)
    if (accion) {
      e.preventDefault()
      onAccion?.(accion)
    }
  }

  return (
    <label className="group block rounded-2xl border border-borde-fuerte bg-superficie px-5 pt-3 pb-4 shadow-tarjeta transition-colors focus-within:border-foco focus-within:ring-4 focus-within:ring-foco/15">
      <span className="text-xs font-semibold tracking-wide text-suave uppercase">{etiqueta}</span>
      <span className="mt-1 flex items-baseline gap-2">
        <span className="text-4xl font-medium text-suave sm:text-5xl" aria-hidden="true">
          $
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          aria-label={etiqueta}
          aria-describedby={describedBy}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- en la caja el cursor tiene que estar siempre listo
          autoFocus={enfocar}
          readOnly={deshabilitado}
          aria-busy={deshabilitado || undefined}
          placeholder="0"
          value={formatearImporteEnCurso(importe)}
          onChange={(e) => onCambio(normalizarImporte(e.target.value))}
          onKeyDown={alPresionar}
          className="w-full min-w-0 bg-transparent text-5xl font-semibold tracking-tight text-texto cifras outline-none placeholder:text-borde-fuerte read-only:opacity-60 sm:text-6xl"
        />
      </span>
    </label>
  )
})
