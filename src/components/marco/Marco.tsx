import {
  BarChart3,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Sun,
  UserCog,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import vaca from '../../assets/vaca.svg'
import { useTema, type Tema } from '../../lib/tema'
import { useSesion } from '../../sesion/Sesion'

interface Seccion {
  a: string
  texto: string
  Icono: LucideIcon
  soloAdmin?: boolean
}

const SECCIONES: Seccion[] = [
  { a: '/', texto: 'Caja', Icono: Store },
  { a: '/consulta', texto: 'Consulta', Icono: Search, soloAdmin: true },
  { a: '/panel', texto: 'Panel', Icono: BarChart3, soloAdmin: true },
  { a: '/egresos', texto: 'Egresos', Icono: Receipt, soloAdmin: true },
  { a: '/usuarios', texto: 'Usuarios', Icono: UserCog, soloAdmin: true },
  { a: '/auditoria', texto: 'Auditoría', Icono: ShieldCheck, soloAdmin: true },
  { a: '/ajustes', texto: 'Ajustes', Icono: Settings, soloAdmin: true },
]

const TEMAS: Record<Tema, { siguiente: Tema; texto: string; Icono: LucideIcon }> = {
  sistema: { siguiente: 'claro', texto: 'Tema automático', Icono: Monitor },
  claro: { siguiente: 'oscuro', texto: 'Tema claro', Icono: Sun },
  oscuro: { siguiente: 'sistema', texto: 'Tema oscuro', Icono: Moon },
}

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-[10px] bg-marca shadow-tarjeta">
        <img src={vaca} alt="" className="w-6 invert" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight">Avícola GD</span>
        <span className="block text-xs text-suave">Carnicería · Avícola</span>
      </span>
    </div>
  )
}

function Navegacion({ alElegir }: { alElegir?: () => void }) {
  const { esAdmin } = useSesion()
  return (
    <nav aria-label="Secciones" className="flex flex-col gap-0.5">
      {SECCIONES.filter((s) => esAdmin || !s.soloAdmin).map(({ a, texto, Icono }) => (
        <NavLink
          key={a}
          to={a}
          end={a === '/'}
          onClick={alElegir}
          className={({ isActive }) =>
            `group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-marca-suave font-semibold text-marca before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-marca'
                : 'text-suave hover:bg-hundida hover:text-texto'
            }`
          }
        >
          <Icono
            className="size-[18px] transition-transform group-hover:scale-110"
            aria-hidden="true"
          />
          {texto}
        </NavLink>
      ))}
    </nav>
  )
}

function PieUsuario() {
  const { perfil, cerrarSesion } = useSesion()
  const [tema, setTema] = useTema()
  const { siguiente, texto, Icono } = TEMAS[tema]
  return (
    <div className="flex flex-col gap-1 border-t border-borde pt-3">
      <div className="flex items-center gap-3 px-3 pb-2">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-marca text-sm font-semibold text-sobre-marca"
        >
          {(perfil?.nombre ?? '?').slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{perfil?.nombre}</span>
          <span className="block text-xs text-suave">
            {perfil?.rol === 'admin' ? 'Dueño' : 'Mostrador'}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setTema(siguiente)}
        className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-suave hover:bg-hundida hover:text-texto"
      >
        <Icono className="size-[18px]" aria-hidden="true" /> {texto}
      </button>
      <button
        type="button"
        onClick={() => void cerrarSesion()}
        className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-suave hover:bg-hundida hover:text-texto"
      >
        <LogOut className="size-[18px]" aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  )
}

export function Marco() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const ubicacion = useLocation()

  return (
    <div className="min-h-dvh lg:pl-60">
      <a
        href="#contenido"
        className="sr-only rounded-lg bg-marca px-3 py-2 text-sobre-marca focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Ir al contenido
      </a>

      {/* Escritorio: barra lateral fija */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r border-borde bg-superficie px-3 py-5 lg:flex">
        <div className="px-2">
          <Marca />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Navegacion />
        </div>
        <PieUsuario />
      </aside>

      {/* Celular y tablet: barra superior con menú */}
      <header className="sticky top-0 z-40 border-b border-borde bg-superficie/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Marca />
          <button
            type="button"
            onClick={() => setMenuAbierto((m) => !m)}
            aria-expanded={menuAbierto}
            aria-controls="menu-celular"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            className="grid size-11 place-items-center rounded-lg text-suave hover:bg-hundida"
          >
            {menuAbierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuAbierto && (
          <div
            id="menu-celular"
            className="flex animate-aparecer flex-col gap-3 border-t border-borde px-3 py-3"
          >
            <Navegacion alElegir={() => setMenuAbierto(false)} />
            <PieUsuario />
          </div>
        )}
      </header>

      <main
        id="contenido"
        key={ubicacion.pathname}
        className="mx-auto max-w-6xl animate-pagina px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <Outlet />
      </main>
    </div>
  )
}
