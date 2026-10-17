import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { Diferencia, ResumenDia } from '../components/caja/ResumenDia'
import { Teclado } from '../components/caja/Teclado'
import { Visor } from '../components/caja/Visor'
import { Boton } from '../components/ui/Boton'
import { AreaTexto } from '../components/ui/Campo'
import { Cargando, MensajeError, Tarjeta, Titulo } from '../components/ui/Estados'
import { useCerrarDia, useEstadoDelDia, useResumenJornada, type Jornada } from '../datos/caja'
import { calcularArqueo } from '../lib/caja'
import { mensajeDeError } from '../lib/errores'
import { formatearFecha, formatearPesos } from '../lib/formato'
import { aplicarTecla } from '../lib/importe'

export function CerrarDia() {
  const estado = useEstadoDelDia()
  const [cerrada, setCerrada] = useState<Jornada | null>(null)

  if (cerrada) return <DiaCerradoOk jornada={cerrada} />
  if (estado.isPending) return <Cargando />
  if (estado.isError) return <MensajeError>{mensajeDeError(estado.error)}</MensajeError>
  if (!estado.data.abierta) return <Navigate to="/" replace />
  return <FormularioCierre jornada={estado.data.abierta} alCerrar={setCerrada} />
}

function FormularioCierre({
  jornada,
  alCerrar,
}: {
  jornada: Jornada
  alCerrar: (j: Jornada) => void
}) {
  const resumen = useResumenJornada(jornada.id)
  const cerrar = useCerrarDia()
  const [contado, setContado] = useState(0)
  const [tipeado, setTipeado] = useState(false)
  const [nota, setNota] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  if (resumen.isPending) return <Cargando />
  if (resumen.isError || !resumen.data)
    return <MensajeError>{mensajeDeError(resumen.error)}</MensajeError>

  const arqueo = calcularArqueo(resumen.data.fondo_inicial, resumen.data.total_efectivo, contado)
  const fecha = formatearFecha(new Date(`${jornada.fecha}T12:00:00-03:00`))

  return (
    <div>
      <Titulo
        accion={
          <Link
            to="/"
            className="min-h-11 py-2 font-bold text-suave underline-offset-4 hover:underline"
          >
            ← Volver a la caja
          </Link>
        }
      >
        Cerrar el día {fecha.slice(0, 5)}
      </Titulo>
      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta className="self-start">
          <ResumenDia resumen={resumen.data} />
        </Tarjeta>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-bold">Contá el efectivo de la caja</h2>
            <p className="text-sm text-suave">
              Incluí el fondo inicial. Esperado: {formatearPesos(arqueo.esperado)}
            </p>
          </div>
          <Visor importe={contado} etiqueta="Efectivo contado" />
          <Teclado
            onTecla={(t) => {
              setConfirmando(false)
              setTipeado(true)
              setContado((c) => aplicarTecla(c, t))
            }}
          />
          <div aria-live="polite" className="min-h-8">
            {tipeado && <Diferencia monto={arqueo.diferencia} />}
          </div>
          <AreaTexto
            etiqueta="Nota (opcional)"
            placeholder={
              arqueo.diferencia !== 0 && tipeado
                ? 'Ej.: faltó cambio, se pagó un flete'
                : 'Algo que el dueño tenga que saber'
            }
            maxLength={500}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />

          {cerrar.isError && <MensajeError>{mensajeDeError(cerrar.error)}</MensajeError>}

          {confirmando ? (
            <div
              role="alertdialog"
              aria-labelledby="confirmar-cierre"
              className="flex flex-col gap-3 rounded-2xl border-2 border-alerta bg-superficie p-4"
            >
              <p id="confirmar-cierre" className="text-lg font-bold">
                Vas a cerrar el día. Después no se puede modificar sin un administrador.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Boton variante="secundario" className="h-14" onClick={() => setConfirmando(false)}>
                  Volver
                </Boton>
                <Boton
                  variante="peligro"
                  className="h-14"
                  cargando={cerrar.isPending}
                  onClick={() =>
                    cerrar.mutate({ jornadaId: jornada.id, contado, nota }, { onSuccess: alCerrar })
                  }
                >
                  Sí, cerrar el día
                </Boton>
              </div>
            </div>
          ) : (
            <Boton
              className="h-14 text-lg"
              disabled={!tipeado}
              onClick={() => setConfirmando(true)}
            >
              {tipeado ? 'Cerrar el día' : 'Tipeá el efectivo contado'}
            </Boton>
          )}
        </div>
      </div>
    </div>
  )
}

function DiaCerradoOk({ jornada }: { jornada: Jornada }) {
  return (
    <Tarjeta className="mx-auto flex max-w-md flex-col gap-4 p-6 text-center">
      <h1 className="font-cartel text-4xl font-extrabold uppercase">Día cerrado</h1>
      <p>
        La caja del {formatearFecha(new Date(`${jornada.fecha}T12:00:00-03:00`))} quedó cerrada.
      </p>
      {jornada.diferencia_efectivo !== null && <Diferencia monto={jornada.diferencia_efectivo} />}
      <Link
        to="/"
        className="flex min-h-14 items-center justify-center rounded-xl bg-marca text-lg font-bold text-sobre-marca"
      >
        Volver al inicio
      </Link>
    </Tarjeta>
  )
}
