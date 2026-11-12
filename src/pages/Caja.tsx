import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Receipt,
  Smartphone,
  TrendingUp,
  WifiOff,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CargaVenta } from '../components/caja/CargaVenta'
import { ListaVentas } from '../components/caja/ListaVentas'
import { MandarResumen } from '../components/caja/MandarResumen'
import { Boton } from '../components/ui/Boton'
import { Cargando, MensajeError, Tarjeta, Titulo } from '../components/ui/Estados'
import {
  useEstadoDelDia,
  useResumenJornada,
  useVentasDeJornada,
  type Jornada,
  type ResumenJornada,
} from '../datos/caja'
import { horaArgentina, saludo } from '../lib/ayudas'
import { mensajeDeError } from '../lib/errores'
import { cantidadVentas, fechaDeTrabajo, formatearPesos } from '../lib/formato'
import { diaSemanaCorto } from '../lib/periodos'
import { useEnLinea } from '../lib/useEnLinea'
import { useNumeroAnimado } from '../lib/useNumeroAnimado'
import { useSesion } from '../sesion/Sesion'

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
      <AvisoLunes />
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
      ) : (
        <CajaDeHoy
          hoy={estado.data.hoy}
          jornada={
            // El día se abre solo con la primera venta: si todavía no hay, la caja arranca en cero.
            estado.data.abierta?.fecha === estado.data.hoy ? estado.data.abierta : null
          }
        />
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

/** Los lunes, al dueño le recuerda que ya está el resumen de la semana pasada. */
function AvisoLunes() {
  const { esAdmin } = useSesion()
  const esLunes = new Date(`${fechaDeTrabajo(new Date())}T12:00:00`).getDay() === 1
  if (!esAdmin || !esLunes) return null
  return (
    <Link
      to="/panel"
      className="flex presionable animate-aparecer items-center gap-3 rounded-xl border border-marca/20 bg-marca-suave px-4 py-3 text-sm font-medium text-marca hover:brightness-95"
    >
      <CalendarDays className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">
        Ya está el resumen de la semana pasada para mandar por WhatsApp.
      </span>
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  )
}

function Indicador({
  etiqueta,
  valor,
  detalle,
  Icono,
  tono,
  className = '',
}: {
  etiqueta: string
  valor: number
  detalle?: string
  Icono: typeof Banknote
  tono: string
  className?: string
}) {
  const animado = useNumeroAnimado(valor)
  return (
    <div
      className={`rounded-xl border border-borde bg-superficie p-4 shadow-tarjeta transition-shadow hover:shadow-alta ${className}`}
    >
      <p className="flex items-center gap-2 text-xs font-medium text-suave">
        <span className={`grid size-7 place-items-center rounded-lg ${tono}`}>
          <Icono className="size-4" aria-hidden="true" />
        </span>
        {etiqueta}
      </p>
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
      <div className="relative col-span-2 overflow-hidden rounded-2xl bg-linear-to-br from-marca to-marca-hover p-5 text-sobre-marca shadow-alta sm:col-span-3">
        <TrendingUp
          className="pointer-events-none absolute -right-4 -bottom-6 size-32 opacity-10"
          aria-hidden="true"
        />
        <p className="text-xs font-medium tracking-wide uppercase opacity-80">Total de hoy</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight cifras">{p(totalAnimado)}</p>
        {suma && (
          <span
            key={suma.clave}
            aria-hidden="true"
            className="absolute top-5 right-5 animate-flotar rounded-full bg-white/20 px-3 py-1 text-sm font-semibold cifras"
          >
            + {p(suma.monto)}
          </span>
        )}
        <p className="mt-1 text-sm opacity-80">{cantidadVentas(r?.cantidad_ventas ?? 0)}</p>
      </div>
      <Indicador
        etiqueta="Efectivo"
        Icono={Banknote}
        tono="bg-marca-suave text-marca"
        valor={r?.total_efectivo ?? 0}
        detalle={cantidadVentas(r?.cantidad_efectivo ?? 0)}
      />
      <Indicador
        etiqueta="Digital"
        Icono={Smartphone}
        tono="bg-digital-suave text-digital"
        valor={r?.total_digital ?? 0}
        detalle={cantidadVentas(r?.cantidad_digital ?? 0)}
      />
      <Indicador
        etiqueta="Ticket promedio"
        Icono={Receipt}
        tono="bg-ok-suave text-ok"
        valor={Math.round(r?.ticket_promedio ?? 0)}
        detalle="Por venta"
        className="col-span-2 sm:col-span-1"
      />
    </div>
  )
}

function CajaDeHoy({ hoy, jornada }: { hoy: string; jornada: Jornada | null }) {
  const { esAdmin } = useSesion()
  const saludoDelDia = useSaludo()
  const resumen = useResumenJornada(jornada?.id)
  const ventas = useVentasDeJornada(jornada?.id)
  const [resaltada, setResaltada] = useState<string | null>(null)

  return (
    <div>
      <Titulo
        subtitulo={
          <>
            {saludoDelDia} ·{' '}
            <span className="inline-block first-letter:uppercase">{diaSemanaCorto(hoy)}</span>
          </>
        }
      >
        Caja de hoy
      </Titulo>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,30rem)_1fr]">
        <Tarjeta className="self-start p-6">
          <CargaVenta onGuardada={(v) => setResaltada(v.id)} />
        </Tarjeta>
        <div className="flex min-w-0 flex-col gap-4">
          <IndicadoresDelDia r={resumen.data} />
          <Tarjeta sinRelleno>
            {ventas.isError ? (
              <div className="p-5">
                <MensajeError>{mensajeDeError(ventas.error)}</MensajeError>
              </div>
            ) : !jornada || ventas.data ? (
              <ListaVentas ventas={ventas.data ?? []} editable limite={10} resaltada={resaltada} />
            ) : (
              <Cargando />
            )}
          </Tarjeta>
          {esAdmin && jornada && (resumen.data?.cantidad_ventas ?? 0) > 0 && (
            <MandarResumen jornada={jornada} />
          )}
        </div>
      </div>
    </div>
  )
}
