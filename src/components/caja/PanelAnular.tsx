import { useState } from 'react'
import { useAnularVenta } from '../../datos/caja'
import { mensajeDeError } from '../../lib/errores'
import { formatearPesos } from '../../lib/formato'
import { Boton } from '../ui/Boton'

const MOTIVOS_RAPIDOS = [
  'Error de tipeo',
  'Se cargó dos veces',
  'Tipo de pago equivocado',
  'El cliente devolvió',
]

/** Anular con motivo obligatorio. Inline, sin modal, para no frenar el mostrador. */
export function PanelAnular({
  venta,
  alTerminar,
}: {
  venta: { id: string; importe: number }
  alTerminar: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const anular = useAnularVenta()

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-borde bg-hundida p-4"
      role="group"
      aria-label={`Anular venta de ${formatearPesos(venta.importe, { sinCentavos: true })}`}
    >
      <p className="text-sm font-semibold">
        ¿Por qué anulás esta venta de {formatearPesos(venta.importe, { sinCentavos: true })}?
      </p>
      <div className="flex flex-wrap gap-2">
        {MOTIVOS_RAPIDOS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMotivo(m)}
            aria-pressed={motivo === m}
            className="min-h-9 rounded-full border border-borde-fuerte bg-superficie px-3 text-sm font-medium hover:bg-hundida aria-pressed:border-marca aria-pressed:bg-marca aria-pressed:text-sobre-marca"
          >
            {m}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Motivo
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
          className="min-h-11 rounded-[10px] border border-borde-fuerte bg-superficie px-3 font-normal focus:border-foco focus:ring-3 focus:ring-foco/20 focus:outline-none"
          placeholder="Ej.: error de tipeo"
        />
      </label>
      {anular.error && (
        <p role="alert" className="text-sm font-medium text-alerta-texto">
          {mensajeDeError(anular.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Boton variante="secundario" tamano="chico" onClick={alTerminar}>
          No anular
        </Boton>
        <Boton
          variante="peligro"
          tamano="chico"
          disabled={motivo.trim().length < 3}
          cargando={anular.isPending}
          onClick={() =>
            anular.mutate({ id: venta.id, motivo: motivo.trim() }, { onSuccess: alTerminar })
          }
        >
          Anular venta
        </Boton>
      </div>
    </div>
  )
}
