import { useState } from 'react'
import { Link } from 'react-router'
import { CargaVenta } from '../components/caja/CargaVenta'
import { ListaVentas } from '../components/caja/ListaVentas'
import { ResumenDia } from '../components/caja/ResumenDia'
import { Boton } from '../components/ui/Boton'
import { Campo } from '../components/ui/Campo'
import { Cargando, MensajeError, Tarjeta } from '../components/ui/Estados'
import {
  useAbrirDia,
  useEstadoDelDia,
  useReabrirDia,
  useResumenJornada,
  useVentasDeJornada,
  type Jornada,
} from '../datos/caja'
import { mensajeDeError } from '../lib/errores'
import { formatearFecha, formatearPesos } from '../lib/formato'
import { useEnLinea } from '../lib/useEnLinea'
import { textoAMonto } from '../lib/validacion'
import { useSesion } from '../sesion/Sesion'

function fechaCorta(fecha: string) {
  return formatearFecha(new Date(`${fecha}T12:00:00-03:00`)).slice(0, 5)
}

export function Caja() {
  const estado = useEstadoDelDia()
  const enLinea = useEnLinea()

  return (
    <div className="flex flex-col gap-4">
      {!enLinea && (
        <div role="alert" className="rounded-xl bg-alerta px-4 py-3 font-bold text-white">
          Sin internet. Las ventas no se van a guardar hasta que vuelva la conexión.
        </div>
      )}
      {estado.isPending ? (
        <Cargando texto="Buscando el día…" />
      ) : estado.isError ? (
        <MensajeError
          accion={
            <Boton variante="secundario" onClick={() => void estado.refetch()}>
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
        <AbrirDia />
      )}
    </div>
  )
}

function AbrirDia() {
  const abrir = useAbrirDia()
  const [fondo, setFondo] = useState('')
  const monto = fondo.trim() === '' ? 0 : textoAMonto(fondo)

  return (
    <Tarjeta className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="font-cartel text-4xl font-extrabold uppercase">Abrir el día</h1>
      <p className="text-suave">
        Todavía no se abrió la caja de hoy. Abrila para empezar a cargar ventas.
      </p>
      <Campo
        etiqueta="Fondo de caja inicial (opcional)"
        inputMode="decimal"
        placeholder="0"
        value={fondo}
        onChange={(e) => setFondo(e.target.value)}
        ayuda="El efectivo con el que arranca la caja, para el cambio."
        error={monto === null ? 'Escribí solo números, por ejemplo 10000' : undefined}
      />
      {abrir.isError && <MensajeError>{mensajeDeError(abrir.error)}</MensajeError>}
      <Boton
        className="h-16 text-xl"
        disabled={monto === null}
        cargando={abrir.isPending}
        onClick={() => monto !== null && abrir.mutate(monto)}
      >
        Abrir el día
      </Boton>
    </Tarjeta>
  )
}

function DiaViejoAbierto({ jornada }: { jornada: Jornada }) {
  return (
    <Tarjeta className="mx-auto flex w-full max-w-md flex-col gap-4 border-2 border-aviso p-6">
      <h1 className="font-cartel text-3xl font-extrabold uppercase">
        Quedó abierto el {fechaCorta(jornada.fecha)}
      </h1>
      <p>Antes de abrir el día de hoy hay que cerrar ese día y contar la caja.</p>
      <Link
        to="/cerrar"
        className="flex min-h-14 items-center justify-center rounded-xl bg-marca text-lg font-bold text-sobre-marca"
      >
        Cerrar el día {fechaCorta(jornada.fecha)}
      </Link>
    </Tarjeta>
  )
}

function DiaCerrado({ jornada }: { jornada: Jornada }) {
  const { esAdmin } = useSesion()
  const resumen = useResumenJornada(jornada.id)
  const reabrir = useReabrirDia()
  const [confirmar, setConfirmar] = useState(false)

  return (
    <Tarjeta className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="font-cartel text-3xl font-extrabold uppercase">El día de hoy ya se cerró</h1>
      <p className="text-suave">La caja quedó bloqueada. Mañana se abre un día nuevo.</p>
      {resumen.data && <ResumenDia resumen={resumen.data} />}
      {esAdmin &&
        (confirmar ? (
          <div className="flex flex-col gap-3 rounded-xl bg-hundida p-3">
            <p className="font-bold">¿Reabrir el día? Va a quedar registrado en la auditoría.</p>
            {reabrir.isError && (
              <p className="font-bold text-alerta-texto">{mensajeDeError(reabrir.error)}</p>
            )}
            <div className="flex gap-2">
              <Boton variante="secundario" onClick={() => setConfirmar(false)}>
                No
              </Boton>
              <Boton cargando={reabrir.isPending} onClick={() => reabrir.mutate(jornada.id)}>
                Sí, reabrir
              </Boton>
            </div>
          </div>
        ) : (
          <Boton variante="secundario" onClick={() => setConfirmar(true)}>
            Reabrir el día
          </Boton>
        ))}
    </Tarjeta>
  )
}

function DiaAbierto({ jornada }: { jornada: Jornada }) {
  const resumen = useResumenJornada(jornada.id)
  const ventas = useVentasDeJornada(jornada.id)
  const total = resumen.data?.total ?? 0

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10">
      <div className="flex flex-col gap-4">
        <p className="flex items-baseline justify-between gap-3 px-1">
          <span className="flex items-center gap-2 text-suave">
            <span className="inline-block size-2 rounded-full bg-ok" aria-hidden="true" /> Abierto ·
            Hoy llevás
          </span>
          <span key={total} className="animate-subir text-3xl font-bold cifras">
            {formatearPesos(total, { sinCentavos: total % 1 === 0 })}
          </span>
        </p>
        <CargaVenta />
      </div>
      <div className="flex flex-col gap-6">
        {ventas.isError ? (
          <MensajeError>{mensajeDeError(ventas.error)}</MensajeError>
        ) : ventas.data ? (
          <ListaVentas ventas={ventas.data} editable limite={8} />
        ) : (
          <Cargando />
        )}
        <div className="mt-4 border-t border-borde pt-6 text-center lg:text-right">
          <Link
            to="/cerrar"
            className="inline-flex min-h-12 items-center px-4 text-lg font-bold text-alerta-texto underline-offset-4 hover:underline"
          >
            Cerrar el día →
          </Link>
          <p className="text-sm text-suave">{resumen.data?.cantidad_ventas ?? 0} ventas cargadas</p>
        </div>
      </div>
    </div>
  )
}
