import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { TablaDatos } from '../../components/graficos/Piezas'
import { Boton } from '../../components/ui/Boton'
import { AreaTexto, Campo, Selector } from '../../components/ui/Campo'
import {
  Cargando,
  EtiquetaMedio,
  MensajeError,
  Tarjeta,
  Titulo,
  Vacio,
} from '../../components/ui/Estados'
import { Segmentado } from '../../components/ui/Segmentado'
import {
  useBorrarPago,
  useCrearPago,
  useEmpleados,
  useGuardarEmpleado,
  usePagosDelPeriodo,
  type Empleado,
  type TipoPago,
} from '../../datos/admin'
import { usePersonalDelMes } from '../../datos/reportes'
import { mensajeDeError } from '../../lib/errores'
import { fechaDeTrabajo, formatearPesos } from '../../lib/formato'
import { fechaLarga, leerFecha } from '../../lib/periodos'
import { esquemaMonto } from '../../lib/validacion'

const TIPOS: { valor: TipoPago; texto: string }[] = [
  { valor: 'sueldo', texto: 'Sueldo' },
  { valor: 'adelanto', texto: 'Adelanto' },
  { valor: 'aguinaldo', texto: 'Aguinaldo' },
  { valor: 'otro', texto: 'Otro' },
]
const nombreTipo = (t: TipoPago) => TIPOS.find((x) => x.valor === t)?.texto ?? t

/** `2026-10` (input month) ↔ `2026-10-01` (período en la base). */
const aPeriodo = (mes: string) => `${mes}-01`
const nombrePeriodo = (periodo: string) =>
  format(leerFecha(periodo), "MMMM 'de' yyyy", { locale: es })

export default function Personal() {
  const hoy = fechaDeTrabajo(new Date())
  const [mes, setMes] = useState(hoy.slice(0, 7))
  const periodo = aPeriodo(mes)

  return (
    <div className="flex flex-col gap-6">
      <Titulo>Personal</Titulo>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <div className="flex flex-col gap-6">
          <FormularioPago hoy={hoy} mesInicial={mes} />
          <Empleados />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <Campo
              etiqueta="Mes"
              type="month"
              value={mes}
              max={hoy.slice(0, 7)}
              onChange={(e) => e.target.value && setMes(e.target.value)}
            />
          </div>
          <ResumenMes periodo={periodo} />
          <PagosDelMes periodo={periodo} />
        </div>
      </div>
    </div>
  )
}

const esquemaPago = z.object({
  empleado_id: z.string().min(1, 'Elegí el empleado'),
  tipo: z.enum(['sueldo', 'adelanto', 'aguinaldo', 'otro']),
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Elegí el mes al que corresponde'),
  fecha: z.string().min(1, 'Elegí la fecha del pago'),
  monto: esquemaMonto,
  medio_pago: z.enum(['efectivo', 'digital'], { error: 'Elegí si se pagó en efectivo o digital' }),
  nota: z.string().max(300),
})

function FormularioPago({ hoy, mesInicial }: { hoy: string; mesInicial: string }) {
  const empleados = useEmpleados()
  const crear = useCrearPago()
  const [guardado, setGuardado] = useState<string | null>(null)
  const { register, handleSubmit, control, reset, formState } = useForm<
    z.input<typeof esquemaPago>,
    unknown,
    z.output<typeof esquemaPago>
  >({
    resolver: zodResolver(esquemaPago),
    defaultValues: {
      empleado_id: '',
      tipo: 'sueldo',
      mes: mesInicial,
      fecha: hoy,
      monto: '',
      nota: '',
    },
  })
  const activos = (empleados.data ?? []).filter((e) => e.activo)

  const guardar = handleSubmit((d) => {
    setGuardado(null)
    crear.mutate(
      {
        empleado_id: d.empleado_id,
        tipo: d.tipo,
        periodo: aPeriodo(d.mes),
        fecha: d.fecha,
        monto: d.monto,
        medio_pago: d.medio_pago,
        nota: d.nota.trim() || null,
      },
      {
        onSuccess: () => {
          const nombre = activos.find((e) => e.id === d.empleado_id)?.nombre ?? ''
          setGuardado(`${nombreTipo(d.tipo)} de ${nombre}: ${formatearPesos(d.monto)}`)
          reset({ empleado_id: '', tipo: d.tipo, mes: d.mes, fecha: d.fecha, monto: '', nota: '' })
        },
      },
    )
  })

  return (
    <Tarjeta>
      <h2 className="mb-3 font-semibold">Registrar un pago</h2>
      {activos.length === 0 && !empleados.isPending ? (
        <Vacio titulo="Todavía no hay empleados">Agregá uno abajo para registrarle pagos.</Vacio>
      ) : (
        <form onSubmit={guardar} noValidate className="flex flex-col gap-3">
          <Selector
            etiqueta="Empleado"
            error={formState.errors.empleado_id?.message}
            {...register('empleado_id')}
          >
            <option value="">Elegí…</option>
            {activos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Selector>
          <Selector etiqueta="Tipo de pago" {...register('tipo')}>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.texto}
              </option>
            ))}
          </Selector>
          <div className="grid grid-cols-2 gap-3">
            <Campo
              etiqueta="Corresponde a"
              type="month"
              error={formState.errors.mes?.message}
              {...register('mes')}
            />
            <Campo
              etiqueta="Fecha de pago"
              type="date"
              max={hoy}
              error={formState.errors.fecha?.message}
              {...register('fecha')}
            />
          </div>
          <Campo
            etiqueta="Monto"
            inputMode="decimal"
            placeholder="Ej.: 650000"
            error={formState.errors.monto?.message}
            {...register('monto')}
          />
          <Controller
            control={control}
            name="medio_pago"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Cómo se pagó</span>
                <Segmentado
                  etiqueta="Cómo se pagó"
                  valor={field.value ?? null}
                  onCambio={field.onChange}
                  opciones={[
                    { valor: 'efectivo', texto: 'Efectivo' },
                    { valor: 'digital', texto: 'Digital' },
                  ]}
                />
                {fieldState.error && (
                  <p className="text-sm font-semibold text-alerta-texto">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
          <AreaTexto etiqueta="Nota (opcional)" maxLength={300} {...register('nota')} />
          {crear.isError && <MensajeError>{mensajeDeError(crear.error)}</MensajeError>}
          {guardado && (
            <p role="status" className="font-semibold text-ok">
              ✓ Guardado: {guardado}
            </p>
          )}
          <Boton type="submit" cargando={crear.isPending}>
            Guardar pago
          </Boton>
        </form>
      )}
    </Tarjeta>
  )
}

function ResumenMes({ periodo }: { periodo: string }) {
  const resumen = usePersonalDelMes(periodo)
  const p = (n: number) => formatearPesos(n)
  if (resumen.isPending) return <Cargando />
  if (resumen.isError) return <MensajeError>{mensajeDeError(resumen.error)}</MensajeError>
  const total = resumen.data.reduce((s, r) => s + r.total, 0)
  return (
    <Tarjeta>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold first-letter:uppercase">
          Costo de personal de {nombrePeriodo(periodo)}
        </h2>
        <span className="text-3xl font-semibold">{p(total)}</span>
      </div>
      <TablaDatos
        columnas={['Empleado', 'Sueldo', 'Adelantos', 'Aguinaldo', 'Otros', 'Total']}
        filas={resumen.data.map((r) => [
          r.nombre,
          p(r.sueldo),
          p(r.adelanto),
          p(r.aguinaldo),
          p(r.otro),
          p(r.total),
        ])}
      />
    </Tarjeta>
  )
}

function PagosDelMes({ periodo }: { periodo: string }) {
  const pagos = usePagosDelPeriodo(periodo)
  const borrar = useBorrarPago()
  const [borrando, setBorrando] = useState<string | null>(null)

  if (pagos.isPending) return <Cargando />
  if (pagos.isError) return <MensajeError>{mensajeDeError(pagos.error)}</MensajeError>
  return (
    <section>
      <h2 className="mb-2 font-semibold">Pagos de este mes</h2>
      {pagos.data.length === 0 ? (
        <Vacio titulo="No hay pagos registrados para este mes" />
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie shadow-tarjeta">
          {pagos.data.map((pg) => (
            <li key={pg.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {nombreTipo(pg.tipo)} · {pg.empleado?.nombre}
                  </p>
                  <p className="text-sm text-suave">
                    Pagado el {fechaLarga(pg.fecha)} · <EtiquetaMedio medio={pg.medio_pago} />
                    {pg.nota ? ` · ${pg.nota}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold cifras">{formatearPesos(pg.monto)}</span>
                  {borrando !== pg.id && (
                    <button
                      type="button"
                      onClick={() => setBorrando(pg.id)}
                      className="min-h-11 px-2 text-sm font-semibold text-alerta-texto underline-offset-4 hover:underline"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>
              {borrando === pg.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-hundida p-3">
                  <p className="flex-1 font-semibold">
                    ¿Borrar este pago? Queda registrado en la auditoría.
                  </p>
                  <Boton variante="secundario" onClick={() => setBorrando(null)}>
                    No
                  </Boton>
                  <Boton
                    variante="peligro"
                    cargando={borrar.isPending}
                    onClick={() => borrar.mutate(pg.id, { onSuccess: () => setBorrando(null) })}
                  >
                    Sí, borrar
                  </Boton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {borrar.isError && <MensajeError>{mensajeDeError(borrar.error)}</MensajeError>}
    </section>
  )
}

function Empleados() {
  const empleados = useEmpleados()
  const guardar = useGuardarEmpleado()
  const [editando, setEditando] = useState<Partial<Empleado> | null>(null)

  return (
    <Tarjeta>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Empleados</h2>
        {!editando && (
          <Boton
            variante="secundario"
            className="min-h-11"
            onClick={() => setEditando({ nombre: '', activo: true })}
          >
            Agregar empleado
          </Boton>
        )}
      </div>
      {editando && (
        <form
          className="mb-3 flex flex-col gap-3 rounded-xl bg-hundida p-3"
          onSubmit={(e) => {
            e.preventDefault()
            if ((editando.nombre ?? '').trim().length < 2) return
            guardar.mutate(
              { ...editando, nombre: (editando.nombre ?? '').trim() },
              { onSuccess: () => setEditando(null) },
            )
          }}
        >
          <Campo
            etiqueta="Nombre y apellido"
            value={editando.nombre ?? ''}
            onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
            maxLength={80}
          />
          <Campo
            etiqueta="Fecha de ingreso (opcional)"
            type="date"
            value={editando.fecha_ingreso ?? ''}
            onChange={(e) => setEditando({ ...editando, fecha_ingreso: e.target.value || null })}
          />
          <AreaTexto
            etiqueta="Nota (opcional)"
            value={editando.nota ?? ''}
            onChange={(e) => setEditando({ ...editando, nota: e.target.value || null })}
            maxLength={300}
          />
          {guardar.isError && (
            <p className="font-semibold text-alerta-texto">{mensajeDeError(guardar.error)}</p>
          )}
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => setEditando(null)}>
              Cancelar
            </Boton>
            <Boton
              type="submit"
              cargando={guardar.isPending}
              disabled={(editando.nombre ?? '').trim().length < 2}
            >
              Guardar empleado
            </Boton>
          </div>
        </form>
      )}
      <ul className="divide-y divide-borde">
        {(empleados.data ?? []).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div>
              <p className={`font-semibold ${e.activo ? '' : 'text-suave'}`}>
                {e.nombre}{' '}
                {!e.activo && <span className="text-sm font-normal">(ya no trabaja)</span>}
              </p>
              {e.nota && <p className="text-sm text-suave">{e.nota}</p>}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="min-h-11 px-2 text-sm font-semibold text-suave underline-offset-4 hover:underline"
                onClick={() => setEditando(e)}
              >
                Editar
              </button>
              <button
                type="button"
                className="min-h-11 px-2 text-sm font-semibold text-suave underline-offset-4 hover:underline"
                onClick={() => guardar.mutate({ ...e, activo: !e.activo })}
              >
                {e.activo ? 'Dar de baja' : 'Reactivar'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  )
}
