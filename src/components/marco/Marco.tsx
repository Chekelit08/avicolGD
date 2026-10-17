import { NavLink, Outlet } from 'react-router'
import { formatearDiaCorto } from '../../lib/formato'
import { useSesion } from '../../sesion/Sesion'
import { Cinta } from '../marca/Cinta'

const SECCIONES_ADMIN = [
  { a: '/', texto: 'Caja' },
  { a: '/consulta', texto: 'Consulta' },
  { a: '/panel', texto: 'Panel' },
  { a: '/egresos', texto: 'Egresos' },
  { a: '/personal', texto: 'Personal' },
  { a: '/usuarios', texto: 'Usuarios' },
  { a: '/auditoria', texto: 'Auditoría' },
]

export function Marco() {
  const { perfil, esAdmin, cerrarSesion } = useSesion()

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-10">
      <a
        href="#contenido"
        className="sr-only rounded-lg bg-marca px-3 py-2 text-sobre-marca focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Ir al contenido
      </a>
      <header className="pt-3">
        <Cinta>
          <div className="flex items-center justify-between gap-3">
            <span className="font-cartel text-2xl font-extrabold tracking-wide uppercase">
              Avícola GD
            </span>
            <span className="text-sm">{formatearDiaCorto(new Date())}</span>
          </div>
        </Cinta>
        <div className="mt-2 flex items-center justify-between gap-3 px-1">
          {esAdmin ? (
            <nav aria-label="Secciones" className="-mx-1 flex gap-1 overflow-x-auto">
              {SECCIONES_ADMIN.map((s) => (
                <NavLink
                  key={s.a}
                  to={s.a}
                  end={s.a === '/'}
                  className={({ isActive }) =>
                    `flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-bold ${isActive ? 'bg-marca text-sobre-marca' : 'text-suave hover:text-texto'}`
                  }
                >
                  {s.texto}
                </NavLink>
              ))}
            </nav>
          ) : (
            <span className="text-sm text-suave">Caja de hoy</span>
          )}
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="hidden text-suave sm:inline">{perfil?.nombre}</span>
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              className="min-h-11 px-2 font-bold text-suave underline-offset-4 hover:text-texto hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main id="contenido" className="mt-4 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
