import { CheckCircle2, PlugZap, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { Aviso, Cargando, Chip, MensajeError, Tarjeta, Titulo } from '../../components/ui/Estados'
import {
  useActualizarConfiguracion,
  useBuscarCobrosMp,
  useCobrosMp,
  useEstadoMp,
  useResolverCobroMp,
  type CobroMp,
  type Configuracion,
} from '../../datos/admin'
import { useConfiguracion } from '../../datos/caja'
import { mensajeDeError } from '../../lib/errores'
import { formatearFecha, formatearHora, formatearPesos } from '../../lib/formato'
import { normalizarWhatsapp } from '../../lib/whatsapp'

export default function Ajustes() {
  const config = useConfiguracion()
  return (
    <div className="flex flex-col gap-6">
      <Titulo subtitulo="Conexión con Mercado Pago, resumen por WhatsApp y topes de la caja.">
        Ajustes
      </Titulo>
      {config.isPending ? (
        <Cargando />
      ) : config.isError ? (
        <MensajeError>{mensajeDeError(config.error)}</MensajeError>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,24rem)]">
          <MercadoPago config={config.data} />
          <div className="flex flex-col gap-6">
            <WhatsappDueno config={config.data} />
            <TopeConfirmacion config={config.data} />
          </div>
        </div>
      )}
    </div>
  )
}

function MercadoPago({ config }: { config: Configuracion }) {
  const estado = useEstadoMp()
  const buscar = useBuscarCobrosMp()
  const cobros = useCobrosMp()
  const actualizar = useActualizarConfiguracion()
  const pendientes = (cobros.data ?? []).filter((c) => c.estado === 'pendiente')
  const resueltos = (cobros.data ?? []).filter((c) => c.estado !== 'pendiente').slice(0, 15)

  return (
    <Tarjeta titulo="Mercado Pago" className="flex flex-col gap-5 self-start">
      <p className="text-sm text-suave">
        Cuando alguien te paga con QR, link o transferencia a la cuenta de Mercado Pago, la venta
        entra sola a la caja como <strong className="text-texto">Digital</strong>. En el mostrador
        no hay que tipearla.
      </p>

      {estado.isPending ? (
        <Cargando texto="Revisando la conexión…" />
      ) : estado.isError ? (
        <MensajeError>{mensajeDeError(estado.error)}</MensajeError>
      ) : estado.data.configurado ? (
        <Aviso tono="ok">
          Conectado a la cuenta <strong>{estado.data.cuenta}</strong>.
        </Aviso>
      ) : (
        <Aviso tono="aviso">
          Todavía no está conectado. Hay que crear una aplicación en Mercado Pago Developers y
          cargar el Access Token en Supabase: los pasos están en <code>docs/MERCADO-PAGO.md</code>.
        </Aviso>
      )}

      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-5 accent-marca"
          checked={config.mp_automatico}
          disabled={actualizar.isPending}
          onChange={(e) => actualizar.mutate({ id: config.id, mp_automatico: e.target.checked })}
        />
        <span>
          <span className="font-medium">Cargar solos los cobros en la caja</span>
          <span className="block text-suave">
            Si lo apagás, los cobros quedan acá abajo y los cargás vos.
          </span>
        </span>
      </label>

      {estado.data?.configurado && (
        <div className="flex flex-wrap items-center gap-3">
          <Boton variante="secundario" cargando={buscar.isPending} onClick={() => buscar.mutate()}>
            <RefreshCw className="size-4" aria-hidden="true" /> Buscar cobros ahora
          </Boton>
          <span className="text-sm text-suave" aria-live="polite">
            {buscar.data?.revisados !== undefined &&
              `Revisamos ${buscar.data.revisados} pagos de los últimos 2 días: ${buscar.data.nuevos ?? 0} nuevos.`}
          </span>
        </div>
      )}
      {buscar.isError && <MensajeError>{mensajeDeError(buscar.error)}</MensajeError>}

      <section aria-labelledby="titulo-pendientes" className="flex flex-col gap-2">
        <h3 id="titulo-pendientes" className="text-[15px] font-semibold">
          Para revisar {pendientes.length > 0 && <Chip tono="aviso">{pendientes.length}</Chip>}
        </h3>
        {cobros.isPending ? (
          <Cargando />
        ) : pendientes.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-suave">
            <CheckCircle2 className="size-4 text-ok" aria-hidden="true" /> No hay cobros sin cargar.
          </p>
        ) : (
          <ul className="divide-y divide-borde rounded-xl border border-borde">
            {pendientes.map((c) => (
              <CobroPendiente key={c.id} cobro={c} />
            ))}
          </ul>
        )}
      </section>

      {resueltos.length > 0 && (
        <section aria-labelledby="titulo-ultimos" className="flex flex-col gap-2">
          <h3 id="titulo-ultimos" className="text-[15px] font-semibold">
            Últimos cobros
          </h3>
          <ul className="divide-y divide-borde rounded-xl border border-borde">
            {resueltos.map((c) => (
              <li key={c.id} className="flex min-h-11 items-center gap-3 px-4 text-sm">
                <span className="w-24 text-suave cifras">{cuando(c.pagado_en)}</span>
                <span className="min-w-0 flex-1 truncate">{c.pagador ?? c.descripcion ?? '—'}</span>
                {c.estado === 'descartado' ? (
                  <Chip>No era venta</Chip>
                ) : (
                  <Chip tono="ok">En la caja</Chip>
                )}
                <span className="w-24 text-right font-semibold cifras">
                  {formatearPesos(c.importe)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Tarjeta>
  )
}

function cuando(fecha: string) {
  const d = new Date(fecha)
  return `${formatearFecha(d).slice(0, 5)} ${formatearHora(d)}`
}

function CobroPendiente({ cobro }: { cobro: CobroMp }) {
  const resolver = useResolverCobroMp()
  const [descartando, setDescartando] = useState(false)
  const [motivo, setMotivo] = useState('')

  return (
    <li className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-suave cifras">{cuando(cobro.pagado_en)}</span>
        <span className="min-w-0 flex-1 truncate">
          {cobro.pagador ?? 'Sin nombre'}
          {cobro.descripcion && <span className="text-suave"> · {cobro.descripcion}</span>}
        </span>
        <span className="text-base font-semibold cifras">{formatearPesos(cobro.importe)}</span>
      </div>
      {descartando ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <Campo
              etiqueta="¿Por qué no es una venta?"
              placeholder="Ej.: me devolvieron un préstamo"
              maxLength={200}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <Boton variante="secundario" onClick={() => setDescartando(false)}>
            Volver
          </Boton>
          <Boton
            disabled={motivo.trim().length < 3}
            cargando={resolver.isPending}
            onClick={() => resolver.mutate({ id: cobro.id, cargar: false, motivo: motivo.trim() })}
          >
            No cargarlo
          </Boton>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Boton
            tamano="chico"
            cargando={resolver.isPending}
            onClick={() => resolver.mutate({ id: cobro.id, cargar: true })}
          >
            <PlugZap className="size-4" aria-hidden="true" /> Cargar en la caja de hoy
          </Boton>
          <Boton variante="secundario" tamano="chico" onClick={() => setDescartando(true)}>
            No es una venta
          </Boton>
        </div>
      )}
      {resolver.isError && <MensajeError>{mensajeDeError(resolver.error)}</MensajeError>}
    </li>
  )
}

function WhatsappDueno({ config }: { config: Configuracion }) {
  const actualizar = useActualizarConfiguracion()
  const [numero, setNumero] = useState(config.whatsapp_dueno ?? '')
  const normalizado = normalizarWhatsapp(numero)
  const invalido = numero.trim() !== '' && !normalizado

  return (
    <Tarjeta titulo="Resumen por WhatsApp" className="flex flex-col gap-4">
      <p className="text-sm text-suave">
        Al cerrar el día aparece un botón para mandarle el resumen a este número.
      </p>
      <Campo
        etiqueta="WhatsApp del dueño"
        inputMode="tel"
        placeholder="11 2233 4455"
        value={numero}
        onChange={(e) => setNumero(e.target.value)}
        error={invalido ? 'Escribí el número con característica, sin el 0 ni el 15.' : undefined}
        ayuda={
          normalizado ? `Se manda a +${normalizado}` : 'Si lo dejás vacío, se elige al mandar.'
        }
      />
      <Boton
        variante="secundario"
        disabled={invalido || (normalizado ?? null) === config.whatsapp_dueno}
        cargando={actualizar.isPending}
        onClick={() => actualizar.mutate({ id: config.id, whatsapp_dueno: normalizado ?? null })}
      >
        Guardar número
      </Boton>
      {actualizar.isError && <MensajeError>{mensajeDeError(actualizar.error)}</MensajeError>}
    </Tarjeta>
  )
}

function TopeConfirmacion({ config }: { config: Configuracion }) {
  const actualizar = useActualizarConfiguracion()
  const [tope, setTope] = useState(String(config.tope_confirmacion))
  const valor = Number(tope.replace(/\D/g, ''))

  return (
    <Tarjeta titulo="Importe alto" className="flex flex-col gap-4">
      <Campo
        etiqueta="Pedir confirmación arriba de ($)"
        inputMode="numeric"
        value={tope}
        onChange={(e) => setTope(e.target.value)}
        ayuda="Para que un cero de más no pase de largo."
      />
      <Boton
        variante="secundario"
        disabled={!(valor > 0) || valor === config.tope_confirmacion}
        cargando={actualizar.isPending}
        onClick={() => actualizar.mutate({ id: config.id, tope_confirmacion: valor })}
      >
        Guardar
      </Boton>
      {actualizar.isError && <MensajeError>{mensajeDeError(actualizar.error)}</MensajeError>}
    </Tarjeta>
  )
}
