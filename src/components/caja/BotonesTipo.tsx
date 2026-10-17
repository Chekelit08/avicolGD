export type MedioPago = 'efectivo' | 'digital'

/**
 * El tipo de pago es el botón de guardar: no hay un medio preseleccionado
 * que se pueda guardar por descuido (ver docs/DECISIONES.md).
 */
export function BotonesTipo({
  habilitado,
  onGuardar,
}: {
  habilitado: boolean
  onGuardar: (medio: MedioPago) => void
}) {
  const base =
    'flex h-20 touch-manipulation flex-col items-center justify-center rounded-2xl text-sobre-medio shadow-sm select-none active:scale-[0.98] disabled:opacity-35 disabled:active:scale-100'
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={!habilitado}
          onClick={() => onGuardar('efectivo')}
          aria-label="Guardar venta en efectivo"
          className={`${base} bg-efectivo`}
        >
          <span className="font-cartel text-3xl font-extrabold tracking-wide uppercase">
            Efectivo
          </span>
          <span className="text-sm opacity-85">Guardar</span>
        </button>
        <button
          type="button"
          disabled={!habilitado}
          onClick={() => onGuardar('digital')}
          aria-label="Guardar venta digital"
          className={`${base} bg-digital`}
        >
          <span className="font-cartel text-3xl font-extrabold tracking-wide uppercase">
            Digital
          </span>
          <span className="text-sm opacity-85">Guardar</span>
        </button>
      </div>
      <p className="mt-2 h-5 text-center text-sm text-suave" aria-live="polite">
        {habilitado ? '' : 'Tipeá el importe y tocá cómo pagó'}
      </p>
    </div>
  )
}
