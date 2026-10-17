import { useEffect, useRef, useState } from 'react'
import { useConfiguracion, useRegistrarVenta, type MedioPago, type Venta } from '../../datos/caja'
import { necesitaConfirmacion } from '../../lib/caja'
import { mensajeDeError } from '../../lib/errores'
import { formatearPesos } from '../../lib/formato'
import { aplicarTecla, teclaDesdeTeclado, type Tecla } from '../../lib/importe'
import { Boton } from '../ui/Boton'
import { BotonesTipo } from './BotonesTipo'
import { PanelAnular } from './PanelAnular'
import { Teclado } from './Teclado'
import { Visor } from './Visor'

const NOMBRE_MEDIO: Record<MedioPago, string> = { efectivo: 'Efectivo', digital: 'Digital' }

/**
 * Carga de una venta: importe + un toque en EFECTIVO o DIGITAL.
 * Si falla (por ejemplo, sin internet), el importe queda en el visor para reintentar.
 */
export function CargaVenta() {
  const [importe, setImporte] = useState(0)
  const [porConfirmar, setPorConfirmar] = useState<MedioPago | null>(null)
  const [ultima, setUltima] = useState<Venta | null>(null)
  const [anulandoUltima, setAnulandoUltima] = useState(false)
  const registrar = useRegistrarVenta()
  const { data: config } = useConfiguracion()
  const tope = config?.tope_confirmacion ?? 500_000
  const temporizador = useRef<number | undefined>(undefined)

  const tocar = (tecla: Tecla) => {
    registrar.reset()
    setPorConfirmar(null)
    setImporte((actual) => aplicarTecla(actual, tecla))
  }

  const guardar = (medio: MedioPago, confirmado = false) => {
    if (importe <= 0 || registrar.isPending) return
    if (!confirmado && necesitaConfirmacion(importe, tope)) {
      setPorConfirmar(medio)
      return
    }
    setPorConfirmar(null)
    registrar.mutate(
      { importe, medio },
      {
        onSuccess: (venta) => {
          navigator.vibrate?.(30)
          setImporte(0)
          setUltima(venta)
          setAnulandoUltima(false)
          window.clearTimeout(temporizador.current)
          temporizador.current = window.setTimeout(() => setUltima(null), 15_000)
        },
      },
    )
  }

  // Teclado físico: números, Backspace, Escape, E = efectivo, D = digital.
  const guardarRef = useRef(guardar)
  useEffect(() => {
    guardarRef.current = guardar
  })
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input, textarea, select, [contenteditable]')
      )
        return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const tecla = teclaDesdeTeclado(e.key)
      if (tecla) {
        e.preventDefault()
        setPorConfirmar(null)
        setImporte((actual) => aplicarTecla(actual, tecla))
      } else if (e.key === 'Escape') {
        setImporte(0)
        setPorConfirmar(null)
      } else if (e.key.toLowerCase() === 'e') {
        guardarRef.current('efectivo')
      } else if (e.key.toLowerCase() === 'd') {
        guardarRef.current('digital')
      }
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [])

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  return (
    <section aria-labelledby="titulo-carga" className="flex flex-col gap-4">
      <h2 id="titulo-carga" className="sr-only">
        Cargar una venta
      </h2>
      <Visor importe={importe} />
      <Teclado onTecla={tocar} />

      {porConfirmar ? (
        <div
          role="alertdialog"
          aria-labelledby="titulo-confirmar"
          className="flex flex-col gap-3 rounded-2xl border-2 border-aviso bg-superficie p-4"
        >
          <p id="titulo-confirmar" className="text-lg font-bold">
            ¿{formatearPesos(importe, { sinCentavos: true })} en{' '}
            {NOMBRE_MEDIO[porConfirmar].toLowerCase()}? Revisá los ceros.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Boton variante="secundario" onClick={() => setPorConfirmar(null)} className="h-14">
              Corregir
            </Boton>
            <Boton onClick={() => guardar(porConfirmar, true)} className="h-14">
              Sí, guardar
            </Boton>
          </div>
        </div>
      ) : (
        <BotonesTipo habilitado={importe > 0 && !registrar.isPending} onGuardar={guardar} />
      )}

      {registrar.isError && (
        <div role="alert" className="rounded-xl bg-alerta px-4 py-3 font-bold text-white">
          {mensajeDeError(registrar.error)}
          <span className="block text-sm font-normal">
            El importe sigue en el visor: tocá Efectivo o Digital para reintentar.
          </span>
        </div>
      )}

      <div role="status" aria-live="polite" className="min-h-12">
        {registrar.isPending ? (
          <p className="px-1 py-3 text-center text-suave">Guardando…</p>
        ) : ultima ? (
          anulandoUltima ? (
            <PanelAnular
              venta={ultima}
              alTerminar={() => {
                setAnulandoUltima(false)
                setUltima(null)
              }}
            />
          ) : (
            <div className="flex animate-aparecer items-center justify-between gap-3 rounded-xl border-l-4 border-ok bg-superficie px-4 py-2 shadow-sm">
              <span>
                <span className="font-bold text-ok">✓ Guardada</span> ·{' '}
                {NOMBRE_MEDIO[ultima.medio_pago]}{' '}
                <span className="font-bold cifras">
                  {formatearPesos(ultima.importe, { sinCentavos: true })}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAnulandoUltima(true)}
                className="min-h-11 px-2 text-sm font-bold text-alerta-texto underline-offset-4 hover:underline"
              >
                Anular
              </button>
            </div>
          )
        ) : null}
      </div>
    </section>
  )
}
