import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Boton } from '../../components/ui/Boton'
import { Campo, Selector } from '../../components/ui/Campo'
import { Cargando, MensajeError, Tarjeta, Titulo } from '../../components/ui/Estados'
import {
  useActualizarPerfil,
  useCrearUsuario,
  usePerfiles,
  useRestablecerClave,
  type Perfil,
  type Rol,
} from '../../datos/admin'
import { claveTemporal } from '../../lib/clave'
import { mensajeDeError } from '../../lib/errores'
import { esquemaClave } from '../../lib/validacion'
import { useSesion } from '../../sesion/Sesion'

const esquema = z.object({
  nombre: z.string().trim().min(1, 'Escribí el nombre').max(80),
  email: z.email('Escribí un email válido'),
  rol: z.enum(['cajero', 'admin']),
  clave: esquemaClave,
})

export default function Usuarios() {
  const perfiles = usePerfiles()
  return (
    <div className="flex flex-col gap-6">
      <Titulo>Usuarios</Titulo>
      <p className="max-w-2xl text-suave">
        Para el mostrador alcanza con una cuenta compartida de cajero. Los administradores (que ven
        egresos, sueldos y reportes) conviene que tengan cada uno su cuenta, así la auditoría dice
        quién hizo qué.
      </p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <NuevoUsuario />
        <div>
          {perfiles.isPending ? (
            <Cargando />
          ) : perfiles.isError ? (
            <MensajeError>{mensajeDeError(perfiles.error)}</MensajeError>
          ) : (
            <ul className="divide-y divide-borde overflow-hidden rounded-2xl border border-borde bg-superficie">
              {perfiles.data.map((p) => (
                <FilaUsuario key={p.id} perfil={p} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function NuevoUsuario() {
  const crear = useCrearUsuario()
  const [creado, setCreado] = useState<{ email: string; clave: string } | null>(null)
  const { register, handleSubmit, reset, setValue, formState } = useForm<z.infer<typeof esquema>>({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: '', email: '', rol: 'cajero', clave: claveTemporal() },
  })

  const guardar = handleSubmit((d) => {
    setCreado(null)
    crear.mutate(d, {
      onSuccess: () => {
        setCreado({ email: d.email, clave: d.clave })
        reset({ nombre: '', email: '', rol: 'cajero', clave: claveTemporal() })
      },
    })
  })

  return (
    <Tarjeta className="self-start">
      <h2 className="mb-3 font-bold">Crear una cuenta</h2>
      <form onSubmit={guardar} noValidate className="flex flex-col gap-3">
        <Campo
          etiqueta="Nombre"
          autoComplete="off"
          error={formState.errors.nombre?.message}
          {...register('nombre')}
        />
        <Campo
          etiqueta="Email"
          type="email"
          autoComplete="off"
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <Selector etiqueta="Rol" {...register('rol')}>
          <option value="cajero">Cajero: carga ventas y cierra el día</option>
          <option value="admin">Administrador: ve y gestiona todo</option>
        </Selector>
        <Campo
          etiqueta="Contraseña temporal"
          autoComplete="off"
          ayuda={
            <>
              La va a tener que cambiar en el primer ingreso.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => setValue('clave', claveTemporal())}
              >
                Generar otra
              </button>
            </>
          }
          error={formState.errors.clave?.message}
          {...register('clave')}
        />
        {crear.isError && <MensajeError>{mensajeDeError(crear.error)}</MensajeError>}
        {creado && (
          <div role="status" className="rounded-xl border-l-4 border-ok px-3 py-2">
            <p className="font-bold text-ok">✓ Cuenta creada</p>
            <p className="text-sm">
              Pasale estos datos: <strong>{creado.email}</strong> /{' '}
              <strong className="cifras">{creado.clave}</strong>
            </p>
          </div>
        )}
        <Boton type="submit" cargando={crear.isPending}>
          Crear cuenta
        </Boton>
      </form>
    </Tarjeta>
  )
}

function FilaUsuario({ perfil }: { perfil: Perfil }) {
  const { perfil: yo } = useSesion()
  const actualizar = useActualizarPerfil()
  const restablecer = useRestablecerClave()
  const [accion, setAccion] = useState<'desactivar' | 'clave' | null>(null)
  const [clave, setClave] = useState('')
  const [nuevaClave, setNuevaClave] = useState<string | null>(null)
  const soyYo = perfil.id === yo?.id

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-bold ${perfil.activo ? '' : 'text-suave line-through'}`}>
            {perfil.nombre} {soyYo && <span className="text-sm font-normal text-suave">(vos)</span>}
          </p>
          <p className="text-sm break-all text-suave">{perfil.email}</p>
          {!perfil.activo && (
            <p className="text-sm font-bold">
              Desactivado: no puede entrar. Su historial se conserva.
            </p>
          )}
          {perfil.activo && perfil.debe_cambiar_clave && (
            <p className="text-sm font-bold text-aviso">Tiene que cambiar la contraseña temporal</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`rol-${perfil.id}`}>
            Rol de {perfil.nombre}
          </label>
          <select
            id={`rol-${perfil.id}`}
            value={perfil.rol}
            disabled={soyYo || !perfil.activo || actualizar.isPending}
            onChange={(e) => actualizar.mutate({ id: perfil.id, rol: e.target.value as Rol })}
            className="min-h-11 rounded-xl border border-borde bg-superficie px-2"
          >
            <option value="cajero">Cajero</option>
            <option value="admin">Administrador</option>
          </select>
          {!soyYo && (
            <>
              <Boton
                variante="secundario"
                className="min-h-11 px-3 text-sm"
                onClick={() => {
                  setClave(claveTemporal())
                  setNuevaClave(null)
                  setAccion('clave')
                }}
              >
                Nueva contraseña
              </Boton>
              {perfil.activo ? (
                <Boton
                  variante="secundario"
                  className="min-h-11 px-3 text-sm"
                  onClick={() => setAccion('desactivar')}
                >
                  Desactivar
                </Boton>
              ) : (
                <Boton
                  variante="secundario"
                  className="min-h-11 px-3 text-sm"
                  cargando={actualizar.isPending}
                  onClick={() => actualizar.mutate({ id: perfil.id, activo: true })}
                >
                  Reactivar
                </Boton>
              )}
            </>
          )}
        </div>
      </div>

      {accion === 'desactivar' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-hundida p-3">
          <p className="flex-1 font-bold">
            ¿Desactivar a {perfil.nombre}? No va a poder entrar más. Queda en la auditoría.
          </p>
          <Boton variante="secundario" onClick={() => setAccion(null)}>
            No
          </Boton>
          <Boton
            variante="peligro"
            cargando={actualizar.isPending}
            onClick={() =>
              actualizar.mutate(
                { id: perfil.id, activo: false },
                { onSuccess: () => setAccion(null) },
              )
            }
          >
            Sí, desactivar
          </Boton>
        </div>
      )}

      {accion === 'clave' && (
        <div className="mt-2 flex flex-col gap-2 rounded-xl bg-hundida p-3">
          {nuevaClave ? (
            <>
              <p role="status">
                <span className="font-bold text-ok">✓ Listo.</span> Contraseña temporal:{' '}
                <strong className="cifras">{nuevaClave}</strong>. La va a tener que cambiar al
                entrar.
              </p>
              <Boton variante="secundario" className="self-start" onClick={() => setAccion(null)}>
                Cerrar
              </Boton>
            </>
          ) : (
            <>
              <Campo
                etiqueta={`Contraseña temporal para ${perfil.nombre}`}
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="off"
              />
              {restablecer.isError && (
                <p className="font-bold text-alerta-texto">{mensajeDeError(restablecer.error)}</p>
              )}
              <div className="flex gap-2">
                <Boton variante="secundario" onClick={() => setAccion(null)}>
                  Cancelar
                </Boton>
                <Boton
                  disabled={clave.length < 10}
                  cargando={restablecer.isPending}
                  onClick={() =>
                    restablecer.mutate(
                      { usuario_id: perfil.id, clave },
                      { onSuccess: () => setNuevaClave(clave) },
                    )
                  }
                >
                  Guardar contraseña
                </Boton>
              </div>
            </>
          )}
        </div>
      )}
      {actualizar.isError && (
        <p className="mt-2 text-sm font-bold text-alerta-texto">
          {mensajeDeError(actualizar.error)}
        </p>
      )}
    </li>
  )
}
