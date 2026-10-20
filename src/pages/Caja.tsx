import { ArrowRight, HandCoins, LockKeyhole, RotateCcw, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CampoImporte } from '../components/caja/CampoImporte'
import { CargaVenta } from '../components/caja/CargaVenta'
import { ListaSalidas } from '../components/caja/ListaSalidas'
import { MandarResumen } from '../components/caja/MandarResumen'
import { ListaVentas } from '../components/caja/ListaVentas'
import { ResumenDia } from '../components/caja/ResumenDia'
import { SacarEfectivo } from '../components/caja/SacarEfectivo'
import { Boton } from '../components/ui/Boton'
import { Aviso, Cargando, Chip, MensajeError, Tarjeta, Titulo } from '../components/ui/Estados'
import {
  useAbrirDia,
  useEstadoDelDia,
  useReabrirDia,
  useResumenJornada,
  useSalidasDeJornada,
  useVentasDeJornada,
  type Jornada,
  type ResumenJornada,
} from '../datos/caja'
import { mensajeDeError } from '../lib/errores'
import { cantidadVentas, formatearFecha, formatearPesos } from '../lib/formato'
import { diaSemanaCorto } from '../lib/periodos'
import { horaArgentina, saludo } from '../lib/ayudas'
import { useEnLinea } from '../lib/useEnLinea'
import { useNumeroAnimado } from '../lib/useNumeroAnimado'
import { useSesion } from '../sesion/Sesion'

function fechaCorta(fecha: string) {
  return formatearFecha(new Date(`${fecha}T12:00:00-03:00`)).slice(0, 5)
}

const p = (n: number) => formatearPesos(n, { sinCentavos: n % 1 === 0 })

export function Caja() {
  const estado = useEstadoDelDia()
  const enLinea = useEnLinea()

  return (
    <div className="flex flex-col gap-4">
      {!enLinea && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl bg-alerta px-4 py-3 font-semibold text-white"
        >
          <WifiOff className="size-5 shrink-0" aria-hidden="true" />
          Sin internet. Las ventas no se van a guardar hasta que vuelva la conexión.
        </div>
      )}
      {estado.isPending ? (
        <Cargando texto="Buscando el día…" />
      ) : estado.isError ? (
        <MensajeError
          accion={
            <Boton variante="secundario" tamano="chico" onClick={() => void estado.refetch()}>
              Reintentar
            </Boton>
          }
        >
          {mensajeDeError(estado.error)}
        </MensajeError>
      ) : estado.data.abierta && estado.data.abierta.fecha !== estado.data.hoy ? (
        <DiaViejoAbierto jornada={estado.data.abierta} />
      ) : estado.data.abierta ? (
        <DiaAbierto jornada={estado.data.abierta} />
      ) : estado.data.deHoy ? (
        <DiaCerrado jornada={estado.data.deHoy} />
      ) : (
        <AbrirDia hoy={estado.data.hoy} />
      )}
    </div>
  )
}

/** "Buenas tardes, Gonza" (a la cuenta compartida del mostrador no se la nombra). */
function useSaludo() {
  const { perfil } = useSesion()
  const nombre = perfil && perfil.rol === 'admin' ? `, ${perfil.nombre.split(' ')[0]}` : ''
  return `${saludo(horaArgentina())}${nombre}`
}

function Centrado({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-md py-6 sm:py-12">{children}</div>
}

function AbrirDia({ hoy }: { hoy: string }) {
  const saludoDelDia = useSaludo()
  const abrir = useAbrirDia()
  const [fondo, setFondo] = useState(0)

  return (
    <Centrado>
      <Tarjeta className="flex flex-col gap-5 p-6">
        <div>
          <p className="text-sm text-suave">
            {saludoDelDia} ·{' '}
            <span className="inline-block first-letter:uppercase">{diaSemanaCorto(hoy)}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Abrir el día</h1>
          <p className="mt-1 text-sm text-suave">
            Si arrancás con plata para el cambio, escribila. Si no, dejalo en 0 y apretá Enter.
          </p>
        </div>
        <CampoImporte
          etiqueta="Fondo de caja inicial"
          importe={fondo}
          onCambio={setFondo}
          enfocar
          onAccion={(a) => {
            if (a === 'efectivo' && !abrir.isPending) abrir.mutate(fondo)
            if (a === 'borrar') setFondo(0)
          }}
        />
        {abrir.isError && <MensajeError>{mensajeDeError(abrir.error)}</MensajeError>}
        <Boton tamano="grande" cargando={abrir.isPending} onClick={() => abrir.mutate(fondo)}>
          Abrir el día · Enter
        </Boton>
      </Tarjeta>
    </Centrado>
  )
}

function DiaViejoAbierto({ jornada }: { jornada: Jornada }) {
  return (
    <Centrado>
      <Tarjeta className="flex flex-col gap-4 p-6">
        <Chip tono="aviso">Pendiente de cierre</Chip>
        <h1 className="text-2xl font-semibold tracking-tight">
          Quedó abierto el {fechaCorta(jornada.fecha)}
        </h1>
        <p className="text-sm text-suave">
          Antes de abrir el día de hoy hay que cerrar ese día y contar la caja.
        </p>
        <Link
          to="/cerrar"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[10px] bg-marca font-semibold text-sobre-marca shadow-tarjeta hover:bg-marca-hover"
        >
          Cerrar el día {fechaCorta(jornada.fecha)}{' '}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Tarjeta>
    </Centrado>
  )
}

function DiaCerrado({ jornada }: { jornada: Jornada }) {
  const { esAdmin } = useSesion()
  const resumen = useResumenJornada(jornada.id)
  const reabrir = useReabrirDia()
  const [confirmar, setConfirmar] = useState(false)

  return (
    <Centrado>
      <Tarjeta className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">El día de hoy ya se cerró</h1>
            <p className="mt-1 text-sm text-suave">
              La caja quedó bloqueada. Mañana se abre un día nuevo.
            </p>
          </div>
          <LockKeyhole className="size-6 text-suave" aria-hidden="true" />
        </div>
        {resumen.data && <ResumenDia resumen={resumen.data} />}
        <MandarResumen jornada={jornada} />
        {esAdmin &&
          (confirmar ? (
            <Aviso
              tono="aviso"
              accion={
                <div className="flex gap-2">
                  <Boton variante="secundario" tamano="chico" onClick={() => setConfirmar(false)}>
                    No
                  </Boton>
                  <Boton
                    tamano="chico"
                    cargando={reabrir.isPending}
                    onClick={() => reabrir.mutate(jornada.id)}
                  >
                    Sí, reabrir
                  </Boton>
                </div>
              }
            >
              ¿Reabrir el día? Va a quedar registrado en la auditoría.
              {reabrir.isError && <span className="block">{mensajeDeError(reabrir.error)}</span>}
            </Aviso>
          ) : (
            <Boton variante="secundario" onClick={() => setConfirmar(true)}>
              <RotateCcw className="size-4" aria-hidden="true" /> Reabrir el día
            </Boton>
          ))}
      </Tarjeta>
    </Centrado>
  )
}

function Indicador({
  etiqueta,
  valor,
  detalle,
  className = '',
}: {
  etiqueta: string
  valor: number
  detalle?: string
  className?: string
}) {
  const animado = useNumeroAnimado(valor)
  return (
    <div
      className={`rounded-xl border border-borde bg-superficie p-4 shadow-tarjeta transition-shadow hover:shadow-alta ${className}`}
    >
      <p className="text-xs font-medium text-suave">{etiqueta}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight cifras">{p(animado)}</p>
      {detalle && <p className="mt-0.5 text-xs text-suave">{detalle}</p>}
    </div>
  )
}

/** Cuando el total sube, muestra "+ $ X" flotando un momento. */
function useSuma(total: number) {
  const anterior = useRef(total)
  const [suma, setSuma] = useState<{ monto: number; clave: number } | null>(null)
  useEffect(() => {
    const diferencia = total - anterior.current
    anterior.current = total
    if (diferencia <= 0) return
    setSuma({ monto: diferencia, clave: Date.now() })
    const t = window.setTimeout(() => setSuma(null), 1_400)
    return () => window.clearTimeout(t)
  }, [total])
  return suma
}

function IndicadoresDelDia({ r }: { r: ResumenJornada | null | undefined }) {
  const total = r?.total ?? 0
  const totalAnimado = useNumeroAnimado(total, 700)
  const suma = useSuma(total)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="relative col-span-2 overflow-hidden rounded-xl border border-borde bg-superficie p-5 shadow-tarjeta sm:col-span-3">
        <p className="text-xs font-medium text-suave">Total de hoy</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight cifras">{p(totalAnimado)}</p>
        {suma && (
          <span
            key={suma.clave}
            aria-hidden="true"
            className="absolute top-5 right-5 animate-flotar rounded-full bg-ok-suave px-3 py-1 text-sm font-semibold text-ok cifras"
          >
            + {p(suma.monto)}
          </span>
        )}
        <p className="mt-0.5 text-xs text-suave">{cantidadVentas(r?.cantidad_ventas ?? 0)}</p>
      </div>
      <Indicador
        etiqueta="Efectivo"
        valor={r?.total_efectivo ?? 0}
        detalle={`${cantidadVentas(r?.cantidad_efectivo ?? 0)} · en caja ${p(r?.efectivo_esperado ?? 0)}`}
      />
      <Indicador
        etiqueta="Digital"
        valor={r?.total_digital ?? 0}
        detalle={cantidadVentas(r?.cantidad_digital ?? 0)}
      />
      <Indicador
        etiqueta="Ticket promedio"
        valor={Math.round(r?.ticket_promedio ?? 0)}
        detalle="Por venta"
        className="col-span-2 sm:col-span-1"
      />
    </div>
  )
}

function DiaAbierto({ jornada }: { jornada: Jornada }) {
  const saludoDelDia = useSaludo()
  const resumen = useResumenJornada(jornada.id)
  const ventas = useVentasDeJornada(jornada.id)
  const salidas = useSalidasDeJornada(jornada.id)
  const [resaltada, setResaltada] = useState<string | null>(null)
  const [sacando, setSacando] = useState(false)

  return (
    <div>
      <Titulo
        subtitulo={
          <>
            {saludoDelDia} ·{' '}
            <span className="inline-block first-letter:uppercase">
              {diaSemanaCorto(jornada.fecha)}
            </span>
          </>
        }
        accion={
          <div className="flex flex-wrap items-center gap-3">
            <Chip tono="ok">
              <span className="animate-latir motion-reduce:animate-none">●</span> Día abierto
            </Chip>
            <button
              type="button"
              onClick={() => setSacando(true)}
              aria-keyshortcuts="-"
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-borde-fuerte bg-superficie px-4 text-[15px] font-semibold shadow-tarjeta hover:bg-hundida"
            >
              <HandCoins className="size-4" aria-hidden="true" /> Sacar efectivo
            </button>
            <Link
              to="/cerrar"
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-borde-fuerte bg-superficie px-4 text-[15px] font-semibold shadow-tarjeta hover:bg-hundida"
            >
              Cerrar el día <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        }
      >
        Caja de hoy
      </Titulo>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,30rem)_1fr]">
        <Tarjeta className="self-start p-6">
          {sacando ? (
            <SacarEfectivo alTerminar={() => setSacando(false)} />
          ) : (
            <CargaVenta
              onGuardada={(v) => setResaltada(v.id)}
              onSacarEfectivo={() => setSacando(true)}
            />
          )}
        </Tarjeta>
        <div className="flex min-w-0 flex-col gap-4">
          <IndicadoresDelDia r={resumen.data} />
          <Tarjeta sinRelleno>
            {ventas.isError ? (
              <div className="p-5">
                <MensajeError>{mensajeDeError(ventas.error)}</MensajeError>
              </div>
            ) : ventas.data ? (
              <ListaVentas ventas={ventas.data} editable limite={10} resaltada={resaltada} />
            ) : (
              <Cargando />
            )}
          </Tarjeta>
          {salidas.data && salidas.data.length > 0 && (
            <Tarjeta sinRelleno>
              <ListaSalidas salidas={salidas.data} editable />
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  )
}
