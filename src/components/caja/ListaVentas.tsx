import { useState } from 'react'
import type { Venta } from '../../datos/caja'
import { puedeAnular } from '../../lib/caja'
import { formatearHora, formatearPesos } from '../../lib/formato'
import { useSesion } from '../../sesion/Sesion'
import { Chip, EtiquetaMedio } from '../ui/Estados'
import { PanelAnular } from './PanelAnular'

export function ListaVentas({
  ventas,
  editable,
  limite,
  titulo,
  resaltada,
}: {
  ventas: Venta[]
  /** false en días cerrados: no se puede anular. */
  editable: boolean
  limite?: number
  titulo?: string
  /** La venta recién guardada se marca un momento. */
  resaltada?: string | null
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
      <div className="flex items-center justify-between gap-3 border-b border-borde px-5 py-3">
        <h2 id="titulo-ventas" className="text-[15px] font-semibold">
          {titulo ?? (limite ? 'Últimas ventas' : 'Ventas')}
        </h2>
        {cantidadAnuladas > 0 && (
          <label className="flex min-h-9 items-center gap-2 text-sm text-suave">
            <input
              type="checkbox"
              checked={mostrarAnuladas}
              onChange={(e) => setMostrarAnuladas(e.target.checked)}
              className="size-4 accent-marca"
            />
            Ver anuladas ({cantidadAnuladas})
          </label>
        )}
      </div>
      {recortadas.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-semibold">Todavía no hay ventas</p>
          <p className="mt-1 text-sm text-suave">
            Tipeá el importe y apretá Enter para cargar la primera.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-borde">
          {recortadas.map((v) => (
            <li key={v.id} className={`px-5 ${v.id === resaltada ? 'animate-resaltar' : ''}`}>
              <div className={`flex min-h-12 items-center gap-4 ${v.anulada ? 'text-suave' : ''}`}>
                <span className="w-11 text-sm text-suave cifras">
                  {formatearHora(new Date(v.registrada_en))}
                </span>
                <span className="w-24">
                  {v.anulada ? (
                    <Chip tono="error">Anulada</Chip>
                  ) : (
                    <EtiquetaMedio medio={v.medio_pago} />
                  )}
                </span>
                <span
                  className={`flex-1 text-right font-semibold cifras ${v.anulada ? 'line-through' : ''}`}
                >
                  {formatearPesos(v.importe, { sinCentavos: v.importe % 1 === 0 })}
                </span>
                <span className="w-16 text-right">
                  {editable && puedeAnular(v, usuario) && anulando !== v.id && (
                    <button
                      type="button"
                      onClick={() => setAnulando(v.id)}
                      className="min-h-9 rounded-lg px-2 text-sm font-medium text-suave hover:bg-alerta-suave hover:text-alerta-texto"
                    >
                      Anular
                    </button>
                  )}
                </span>
              </div>
              {v.anulada && v.motivo_anulacion && (
                <p className="pb-2 pl-15 text-xs text-suave">Motivo: {v.motivo_anulacion}</p>
              )}
              {anulando === v.id && (
                <div className="pb-3">
                  <PanelAnular venta={v} alTerminar={() => setAnulando(null)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {limite && visibles.length > limite && (
        <div className="border-t border-borde px-5 py-2">
          <button
            type="button"
            onClick={() => setVerTodas((t) => !t)}
            className="min-h-9 text-sm font-medium text-suave hover:text-texto"
          >
            {verTodas ? 'Ver menos' : `Ver las ${visibles.length} ventas del día`}
          </button>
        </div>
      )}
    </section>
  )
}
