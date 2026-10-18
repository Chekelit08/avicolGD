import { Banknote, Smartphone, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  useAnularVenta,
  useConfiguracion,
  useRegistrarVenta,
  type MedioPago,
  type Venta,
} from '../../datos/caja'
import { cobroMpParecido, necesitaConfirmacion } from '../../lib/caja'
import { mensajeDeError } from '../../lib/errores'
import type { AccionTecla } from '../../lib/importe'
import { formatearHora, formatearPesos } from '../../lib/formato'
import { Boton } from '../ui/Boton'
import { Aviso } from '../ui/Estados'
import { CampoImporte } from './CampoImporte'

const NOMBRE_MEDIO: Record<MedioPago, string> = { efectivo: 'Efectivo', digital: 'Digital' }

/** Antes de guardar: un importe alto, o un digital que ya entró solo por Mercado Pago. */
type Confirmacion =
  { medio: MedioPago; razon: 'alto' } | { medio: 'digital'; razon: 'mp'; cobro: Venta }

function Tecla({ children }: { children: string }) {
  return (
    <kbd className="hidden rounded-md border border-white/30 bg-white/15 px-1.5 py-0.5 font-mono text-xs font-semibold sm:inline">
      {children}
    </kbd>
  )
}

/**
 * Carga de una venta con el teclado: se tipea el importe y
 * Enter la guarda en efectivo, + la guarda digital. Los botones hacen lo mismo con el mouse.
 * Si falla (por ejemplo, sin internet), el importe queda en el campo para reintentar.
 */
export function CargaVenta({
  ventasDelDia = [],
  onGuardada,
  onSacarEfectivo,
}: {
  /** Para avisar si un digital ya entró solo por Mercado Pago. */
  ventasDelDia?: Venta[]
  onGuardada?: (venta: Venta) => void
  /** Tecla − : pasar a "Sacar efectivo". */
  onSacarEfectivo?: () => void
}) {
  const [importe, setImporte] = useState(0)
  const [porConfirmar, setPorConfirmar] = useState<Confirmacion | null>(null)
  const [ultima, setUltima] = useState<Venta | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const registrar = useRegistrarVenta()
  const anular = useAnularVenta()
  const { data: config } = useConfiguracion()
  const tope = config?.tope_confirmacion ?? 500_000
  const campo = useRef<HTMLInputElement>(null)
  const temporizador = useRef<number | undefined>(undefined)

  const enfocar = () => window.setTimeout(() => campo.current?.focus(), 0)

  const guardar = (medio: MedioPago, confirmado = false) => {
    if (registrar.isPending) return
    if (importe <= 0) {
      setAviso('Escribí el importe y apretá Enter (efectivo) o + (digital).')
      return
    }
    if (!confirmado && medio === 'digital') {
      const cobro = cobroMpParecido(ventasDelDia, importe)
      if (cobro) {
        setPorConfirmar({ medio, razon: 'mp', cobro })
        return
      }
    }
    if (!confirmado && necesitaConfirmacion(importe, tope)) {
      setPorConfirmar({ medio, razon: 'alto' })
      return
    }
    setPorConfirmar(null)
    setAviso(null)
    registrar.mutate(
      { importe, medio },
      {
        onSuccess: (venta) => {
          navigator.vibrate?.(30)
          setImporte(0)
          setUltima(venta)
          onGuardada?.(venta)
          window.clearTimeout(temporizador.current)
          temporizador.current = window.setTimeout(() => setUltima(null), 8_000)
          enfocar()
        },
        onSettled: enfocar,
      },
    )
  }

  const alAccion = (accion: Exclude<AccionTecla, null>) => {
    if (accion === 'salida') {
      if (!porConfirmar) onSacarEfectivo?.()
      return
    }
    if (accion === 'borrar') {
      // Esc con la confirmación abierta = "Corregir": vuelve al importe sin borrarlo.
      // Si ya había entrado por Mercado Pago, "No" descarta el importe.
      if (porConfirmar) {
        if (porConfirmar.razon === 'mp') setImporte(0)
        setPorConfirmar(null)
        return
      }
      setImporte(0)
      setPorConfirmar(null)
      setAviso(null)
      registrar.reset()
      return
    }
    // Con la confirmación abierta, Enter confirma (sea cual sea el tipo elegido antes).
    if (porConfirmar) {
      if (accion === 'efectivo') guardar(porConfirmar.medio, true)
      return
    }
    guardar(accion)
  }

  const deshacer = () => {
    if (!ultima) return
    anular.mutate(
      { id: ultima.id, motivo: 'Deshecha al cargar' },
      {
        onSuccess: () => {
          setUltima(null)
          enfocar()
        },
      },
    )
  }

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  return (
    <section aria-labelledby="titulo-carga" className="flex flex-col gap-4">
      <h2 id="titulo-carga" className="text-[15px] font-semibold">
        Nueva venta
      </h2>

      <CampoImporte
        ref={campo}
        etiqueta="Importe"
        importe={importe}
        enfocar
        deshabilitado={registrar.isPending}
        describedBy="ayuda-teclas"
        onCambio={(n) => {
          setImporte(n)
          setPorConfirmar(null)
          setAviso(null)
          if (registrar.isError) registrar.reset()
        }}
        onAccion={alAccion}
      />

      {porConfirmar ? (
        <div
          role="alertdialog"
          aria-labelledby="titulo-confirmar"
          className="flex flex-col gap-3 rounded-xl border border-aviso/40 bg-aviso-suave p-4"
        >
          {porConfirmar.razon === 'mp' ? (
            <p id="titulo-confirmar" className="font-semibold text-texto">
              Ya entraron {formatearPesos(importe, { sinCentavos: true })} solos por Mercado Pago a
              las {formatearHora(new Date(porConfirmar.cobro.registrada_en))}. ¿Es otra venta?
            </p>
          ) : (
            <p id="titulo-confirmar" className="font-semibold text-texto">
              ¿{formatearPesos(importe, { sinCentavos: true })} en{' '}
              {NOMBRE_MEDIO[porConfirmar.medio].toLowerCase()}? Es un importe alto: revisá los
              ceros.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Boton onClick={() => guardar(porConfirmar.medio, true)}>
              {porConfirmar.razon === 'mp' ? 'Sí, es otra · Enter' : 'Sí, guardar · Enter'}
            </Boton>
            <Boton
              variante="secundario"
              onClick={() => {
                if (porConfirmar.razon === 'mp') setImporte(0)
                setPorConfirmar(null)
                enfocar()
              }}
            >
              {porConfirmar.razon === 'mp' ? 'No, ya está · Esc' : 'Corregir · Esc'}
            </Boton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => guardar('efectivo')}
            disabled={registrar.isPending}
            aria-label="Guardar venta en efectivo"
            className="flex min-h-16 items-center justify-between gap-2 rounded-xl bg-efectivo px-4 text-sobre-medio shadow-tarjeta transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            <span className="flex items-center gap-2 text-lg font-semibold">
              <Banknote className="size-5" aria-hidden="true" /> Efectivo
            </span>
            <Tecla>Enter</Tecla>
          </button>
          <button
            type="button"
            onClick={() => guardar('digital')}
            disabled={registrar.isPending}
            aria-label="Guardar venta digital"
            className="flex min-h-16 items-center justify-between gap-2 rounded-xl bg-digital px-4 text-sobre-medio shadow-tarjeta transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            <span className="flex items-center gap-2 text-lg font-semibold">
              <Smartphone className="size-5" aria-hidden="true" /> Digital
            </span>
            <Tecla>+</Tecla>
          </button>
        </div>
      )}

      <p id="ayuda-teclas" className="text-sm text-suave">
        Tipeá el importe y apretá <strong className="text-texto">Enter</strong> si pagó en efectivo
        o <strong className="text-texto">+</strong> si fue digital (transferencia, tarjeta o Mercado
        Pago). <strong className="text-texto">Esc</strong> borra y{' '}
        <strong className="text-texto">−</strong> saca efectivo de la caja.
      </p>

      {aviso && <Aviso tono="aviso">{aviso}</Aviso>}
      {registrar.isError && (
        <Aviso tono="error">
          {mensajeDeError(registrar.error)} El importe sigue en el campo: apretá Enter o + para
          reintentar.
        </Aviso>
      )}
      {anular.isError && <Aviso tono="error">{mensajeDeError(anular.error)}</Aviso>}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end"
      >
        {registrar.isPending ? (
          <div className="pointer-events-auto animate-aparecer rounded-xl border border-borde bg-superficie px-4 py-3 text-sm shadow-alta">
            Guardando…
          </div>
        ) : ultima ? (
          <div className="pointer-events-auto flex animate-aparecer items-center gap-4 rounded-xl border border-borde bg-superficie px-4 py-3 shadow-alta">
            <span className="text-sm">
              <span className="font-semibold text-ok">✓ Venta guardada</span> ·{' '}
              {NOMBRE_MEDIO[ultima.medio_pago]}{' '}
              <span className="font-semibold cifras">
                {formatearPesos(ultima.importe, { sinCentavos: true })}
              </span>
            </span>
            <button
              type="button"
              onClick={deshacer}
              disabled={anular.isPending}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-alerta-texto hover:bg-alerta-suave"
            >
              <Undo2 className="size-4" aria-hidden="true" /> Deshacer
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
