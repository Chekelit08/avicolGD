import { useState } from 'react'
import type { Venta } from '../../datos/caja'
import { puedeAnular } from '../../lib/caja'
import { formatearHora, formatearPesos } from '../../lib/formato'
import { useSesion } from '../../sesion/Sesion'
import { EtiquetaMedio, Vacio } from '../ui/Estados'
import { PanelAnular } from './PanelAnular'

export function ListaVentas({
  ventas,
  editable,
  limite,
  titulo,
}: {
  ventas: Venta[]
  /** false en días cerrados: no se puede anular. */
  editable: boolean
  limite?: number
  titulo?: string
}) {
  const { perfil, esAdmin } = useSesion()
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false)
  const [anulando, setAnulando] = useState<string | null>(null)
  const [verTodas, setVerTodas] = useState(false)

  const visibles = ventas.filter((v) => mostrarAnuladas || !v.anulada)
  const recortadas = limite && !verTodas ? visibles.slice(0, limite) : visibles
  const cantidadAnuladas = ventas.filter((v) => v.anulada).length
  const usuario = { id: perfil?.id ?? '', esAdmin }

  return (
    <section aria-labelledby="titulo-ventas">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="titulo-ventas" className="font-bold">
          {titulo ?? (limite ? 'Últimas ventas' : 'Ventas')}
        </h2>
        {cantidadAnuladas > 0 && (
          <label className="flex min-h-11 items-center gap-2 text-sm text-suave">
            <input
              type="checkbox"
              checked={mostrarAnuladas}
              onChange={(e) => setMostrarAnuladas(e.target.checked)}
              className="size-5"
            />
            Ver anuladas ({cantidadAnuladas})
          </label>
        )}
      </div>
      {recortadas.length === 0 ? (
        <Vacio titulo="Todavía no hay ventas">
          Tipeá el importe y tocá Efectivo o Digital para cargar la primera.
        </Vacio>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
          {recortadas.map((v) => (
            <li key={v.id} className="px-4 py-2">
              <div className={`flex min-h-11 items-center gap-3 ${v.anulada ? 'text-suave' : ''}`}>
                <span className="w-12 text-sm text-suave cifras">
                  {formatearHora(new Date(v.registrada_en))}
                </span>
                <span
                  className={`flex-1 text-lg font-bold cifras ${v.anulada ? 'line-through' : ''}`}
                >
                  {formatearPesos(v.importe, { sinCentavos: v.importe % 1 === 0 })}
                </span>
                <span className="text-sm">
                  {v.anulada ? (
                    <span className="font-bold">Anulada</span>
                  ) : (
                    <EtiquetaMedio medio={v.medio_pago} />
                  )}
                </span>
                {editable && puedeAnular(v, usuario) && anulando !== v.id && (
                  <button
                    type="button"
                    onClick={() => setAnulando(v.id)}
                    className="min-h-11 px-2 text-sm font-bold text-alerta-texto underline-offset-4 hover:underline"
                  >
                    Anular
                  </button>
                )}
              </div>
              {v.anulada && v.motivo_anulacion && (
                <p className="pb-1 pl-15 text-sm text-suave">Motivo: {v.motivo_anulacion}</p>
              )}
              {anulando === v.id && <PanelAnular venta={v} alTerminar={() => setAnulando(null)} />}
            </li>
          ))}
        </ul>
      )}
      {limite && visibles.length > limite && (
        <button
          type="button"
          onClick={() => setVerTodas((t) => !t)}
          className="mt-2 min-h-11 text-sm font-bold text-suave underline-offset-4 hover:underline"
        >
          {verTodas ? 'Ver menos' : `Ver las ${visibles.length} ventas del día`}
        </button>
      )}
    </section>
  )
}
