import { Copy, KeyRound, MessageCircle, Store, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Boton } from '../../components/ui/Boton'
import { Campo } from '../../components/ui/Campo'
import { Aviso, Cargando, Chip, MensajeError, Tarjeta, Titulo } from '../../components/ui/Estados'
import { Segmentado } from '../../components/ui/Segmentado'
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
import { emailDeUsuario, usuarioDeEmail, usuarioSugerido, usuarioValido } from '../../lib/usuario'
import { enlaceWhatsapp } from '../../lib/whatsapp'
import { useSesion } from '../../sesion/Sesion'

const NOMBRE_ROL: Record<Rol, string> = { cajero: 'Mostrador', admin: 'Dueño' }
const AYUDA_ROL: Record<Rol, string> = {
  cajero: 'Solo carga ventas, saca efectivo y cierra el día.',
  admin: 'Ve todo: consultas, panel, egresos, ajustes y usuarios.',
}

interface Datos {
  usuario: string
  clave: string
}

export default function Usuarios() {
  const perfiles = usePerfiles()
  const [creando, setCreando] = useState<{ nombre: string; usuario: string; rol: Rol } | null>(null)
  const hayMostrador = (perfiles.data ?? []).some((p) => p.rol === 'cajero' && p.activo)

  return (
    <div className="flex flex-col gap-6">
      <Titulo
        subtitulo="Quién puede entrar a la app. Se entra con un usuario y una contraseña."
        accion={
          !creando && (
            <Boton onClick={() => setCreando({ nombre: '', usuario: '', rol: 'cajero' })}>
              <UserPlus className="size-4" aria-hidden="true" /> Nueva cuenta
            </Boton>
          )
        }
      >
        Usuarios
      </Titulo>

      {!creando && perfiles.data && !hayMostrador && (
        <Tarjeta className="flex flex-wrap items-center gap-4">
          <Store className="size-8 text-marca" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Todavía no hay una cuenta para el mostrador</p>
            <p className="text-sm text-suave">
              Es la que queda abierta en la compu del local. Con un clic la creamos.
            </p>
          </div>
          <Boton
            onClick={() => setCreando({ nombre: 'Mostrador', usuario: 'mostrador', rol: 'cajero' })}
          >
            Crear la cuenta Mostrador
          </Boton>
        </Tarjeta>
      )}

      {creando && <NuevaCuenta inicial={creando} alTerminar={() => setCreando(null)} />}

      {perfiles.isPending ? (
        <Cargando />
      ) : perfiles.isError ? (
        <MensajeError>{mensajeDeError(perfiles.error)}</MensajeError>
      ) : (
        <ul className="divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-superficie shadow-tarjeta">
          {perfiles.data.map((p) => (
            <FilaUsuario key={p.id} perfil={p} />
          ))}
        </ul>
      )}
    </div>
  )
}

/** Lo que hay que pasarle a la persona: usuario y contraseña, para copiar o mandar por WhatsApp. */
function DatosDeIngreso({ datos, titulo }: { datos: Datos; titulo: string }) {
  const [copiado, setCopiado] = useState(false)
  const texto = `Avícola GD — tus datos para entrar:\n${location.origin}\nUsuario: ${datos.usuario}\nContraseña: ${datos.clave}\n(La primera vez te pide elegir una nueva.)`
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-ok/30 bg-ok-suave p-4"
    >
      <p className="font-semibold text-ok">✓ {titulo}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-suave">Usuario</dt>
        <dd className="text-lg font-semibold break-all">{datos.usuario}</dd>
        <dt className="text-suave">Contraseña</dt>
        <dd className="text-lg font-semibold cifras">{datos.clave}</dd>
      </dl>
      <p className="text-sm text-suave">
        La primera vez que entre, la app le pide elegir una nueva.
      </p>
      <div className="flex flex-wrap gap-2">
        <Boton
          variante="secundario"
          tamano="chico"
          onClick={() => {
            void navigator.clipboard?.writeText(texto).then(() => setCopiado(true))
          }}
        >
          <Copy className="size-4" aria-hidden="true" /> {copiado ? 'Copiado' : 'Copiar'}
        </Boton>
        <a
          href={enlaceWhatsapp(null, texto)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-2 rounded-[10px] border border-borde-fuerte bg-superficie px-3 text-sm font-semibold shadow-tarjeta hover:bg-hundida"
        >
          <MessageCircle className="size-4" aria-hidden="true" /> Mandar por WhatsApp
        </a>
      </div>
    </div>
  )
}

function NuevaCuenta({
  inicial,
  alTerminar,
}: {
  inicial: { nombre: string; usuario: string; rol: Rol }
  alTerminar: () => void
}) {
  const crear = useCrearUsuario()
  const [nombre, setNombre] = useState(inicial.nombre)
  const [usuario, setUsuario] = useState(inicial.usuario)
  const [usuarioTocado, setUsuarioTocado] = useState(Boolean(inicial.usuario))
  const [rol, setRol] = useState<Rol>(inicial.rol)
  const [clave] = useState(claveTemporal)
  const [creado, setCreado] = useState<Datos | null>(null)
  const [intentado, setIntentado] = useState(false)

  const errorNombre = nombre.trim() ? undefined : 'Escribí el nombre'
  const errorUsuario = usuarioValido(usuario)
    ? undefined
    : 'De 3 a 30 letras o números, sin espacios (por ejemplo: mostrador, juan.perez)'

  const guardar = () => {
    setIntentado(true)
    if (errorNombre || errorUsuario) return
    crear.mutate(
      { nombre: nombre.trim(), email: emailDeUsuario(usuario), rol, clave },
      { onSuccess: () => setCreado({ usuario: usuarioDeEmail(emailDeUsuario(usuario)), clave }) },
    )
  }

  return (
    <Tarjeta className="flex max-w-xl flex-col gap-4">
      <h2 className="font-semibold">Nueva cuenta</h2>
      {creado ? (
        <>
          <DatosDeIngreso datos={creado} titulo={`Cuenta de ${nombre.trim()} creada`} />
          <Boton variante="secundario" className="self-start" onClick={alTerminar}>
            Listo
          </Boton>
        </>
      ) : (
        <>
          <Campo
            etiqueta="Nombre"
            autoComplete="off"
            value={nombre}
            error={intentado ? errorNombre : undefined}
            onChange={(e) => {
              setNombre(e.target.value)
              if (!usuarioTocado) setUsuario(usuarioSugerido(e.target.value))
            }}
          />
          <Campo
            etiqueta="Usuario para entrar"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={usuario}
            ayuda="Es lo que va a escribir para entrar. También puede ser un email."
            error={intentado ? errorUsuario : undefined}
            onChange={(e) => {
              setUsuario(e.target.value.toLowerCase())
              setUsuarioTocado(true)
            }}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Qué puede hacer</span>
            <Segmentado
              etiqueta="Qué puede hacer"
              valor={rol}
              onCambio={setRol}
              opciones={[
                { valor: 'cajero', texto: NOMBRE_ROL.cajero },
                { valor: 'admin', texto: NOMBRE_ROL.admin },
              ]}
            />
            <p className="text-sm text-suave">{AYUDA_ROL[rol]}</p>
          </div>
          <p className="text-sm text-suave">
            La contraseña la armamos nosotros (<strong className="cifras">{clave}</strong>) y te la
            mostramos al crear la cuenta.
          </p>
          {crear.isError && <MensajeError>{mensajeDeError(crear.error)}</MensajeError>}
          <div className="flex flex-wrap gap-2">
            <Boton cargando={crear.isPending} onClick={guardar}>
              Crear cuenta
            </Boton>
            <Boton variante="secundario" onClick={alTerminar}>
              Cancelar
            </Boton>
          </div>
        </>
      )}
    </Tarjeta>
  )
}

function FilaUsuario({ perfil }: { perfil: Perfil }) {
  const { perfil: yo } = useSesion()
  const actualizar = useActualizarPerfil()
  const restablecer = useRestablecerClave()
  const [accion, setAccion] = useState<'desactivar' | 'clave' | null>(null)
  const [nuevaClave, setNuevaClave] = useState<string | null>(null)
  const soyYo = perfil.id === yo?.id
  const usuario = usuarioDeEmail(perfil.email)

  const darClaveNueva = () => {
    const clave = claveTemporal()
    setAccion('clave')
    setNuevaClave(null)
    restablecer.mutate({ usuario_id: perfil.id, clave }, { onSuccess: () => setNuevaClave(clave) })
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-semibold ${perfil.activo ? '' : 'text-suave line-through'}`}>
            {perfil.nombre} {soyYo && <span className="text-sm font-normal text-suave">(vos)</span>}{' '}
            <Chip tono={perfil.rol === 'admin' ? 'marca' : 'neutro'}>{NOMBRE_ROL[perfil.rol]}</Chip>
          </p>
          <p className="text-sm break-all text-suave">Usuario: {usuario}</p>
          {!perfil.activo && <p className="text-sm font-semibold">Desactivada: no puede entrar.</p>}
          {perfil.activo && perfil.debe_cambiar_clave && (
            <p className="text-sm text-aviso">Todavía no entró con su contraseña nueva</p>
          )}
        </div>
        {!soyYo && (
          <div className="flex flex-wrap items-center gap-2">
            {perfil.activo && (
              <Boton
                variante="secundario"
                tamano="chico"
                cargando={restablecer.isPending}
                onClick={darClaveNueva}
              >
                <KeyRound className="size-4" aria-hidden="true" /> Se olvidó la contraseña
              </Boton>
            )}
            {perfil.activo ? (
              <Boton variante="fantasma" tamano="chico" onClick={() => setAccion('desactivar')}>
                Desactivar
              </Boton>
            ) : (
              <Boton
                variante="secundario"
                tamano="chico"
                cargando={actualizar.isPending}
                onClick={() => actualizar.mutate({ id: perfil.id, activo: true })}
              >
                Reactivar
              </Boton>
            )}
          </div>
        )}
      </div>

      {accion === 'desactivar' && (
        <div className="mt-3">
          <Aviso
            tono="aviso"
            accion={
              <div className="flex gap-2">
                <Boton variante="secundario" tamano="chico" onClick={() => setAccion(null)}>
                  No
                </Boton>
                <Boton
                  variante="peligro"
                  tamano="chico"
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
            }
          >
            ¿Desactivar a {perfil.nombre}? No va a poder entrar más. Lo que cargó queda guardado.
          </Aviso>
        </div>
      )}

      {accion === 'clave' && (
        <div className="mt-3 flex flex-col gap-2">
          {restablecer.isError && <MensajeError>{mensajeDeError(restablecer.error)}</MensajeError>}
          {nuevaClave && (
            <>
              <DatosDeIngreso
                datos={{ usuario, clave: nuevaClave }}
                titulo={`Contraseña nueva para ${perfil.nombre}`}
              />
              <Boton
                variante="secundario"
                tamano="chico"
                className="self-start"
                onClick={() => setAccion(null)}
              >
                Listo
              </Boton>
            </>
          )}
        </div>
      )}
      {actualizar.isError && (
        <p className="mt-2 text-sm font-semibold text-alerta-texto">
          {mensajeDeError(actualizar.error)}
        </p>
      )}
    </li>
  )
}
