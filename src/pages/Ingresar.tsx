import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import logo from '../assets/logo-gonza.svg'
import { Boton } from '../components/ui/Boton'
import { Campo } from '../components/ui/Campo'
import { MensajeError } from '../components/ui/Estados'
import { esErrorDeRed, MENSAJE_SIN_INTERNET } from '../lib/errores'
import { supabase } from '../lib/supabase'
import { emailDeUsuario } from '../lib/usuario'
import { useSesion } from '../sesion/Sesion'

const esquema = z.object({
  email: z.string().trim().min(1, 'Escribí tu usuario (por ejemplo, mostrador) o tu email'),
  clave: z.string().min(1, 'Escribí tu contraseña'),
})
type Datos = z.infer<typeof esquema>

export function PantallaAcceso({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={logo}
            alt="Gonza — Carnicería, Chanchería, Avícola"
            className="w-40 animate-pop dark:rounded-xl dark:bg-white dark:p-3"
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-1 text-sm text-suave">Avícola GD · Caja diaria</p>
        </div>
        <div className="animate-pagina rounded-xl border border-borde bg-superficie p-6 shadow-tarjeta">
          {children}
        </div>
      </div>
    </main>
  )
}

export function Ingresar() {
  const { sesion, perfil, aviso } = useSesion()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<Datos>({ resolver: zodResolver(esquema) })

  if (sesion && perfil) {
    const desde = (ubicacion.state as { desde?: string } | null)?.desde ?? '/'
    return <Navigate to={desde} replace />
  }

  const ingresar = handleSubmit(async ({ email, clave }) => {
    setError(null)
    try {
      const { error: e } = await supabase().auth.signInWithPassword({
        email: emailDeUsuario(email),
        password: clave,
      })
      if (e) {
        setError(
          esErrorDeRed(e) ? MENSAJE_SIN_INTERNET : 'El usuario o la contraseña no coinciden.',
        )
        return
      }
      navegar('/', { replace: true })
    } catch (e) {
      setError(
        esErrorDeRed(e) ? MENSAJE_SIN_INTERNET : 'No pudimos iniciar sesión. Probá de nuevo.',
      )
    }
  })

  return (
    <PantallaAcceso titulo="Ingresá a tu caja">
      <form onSubmit={ingresar} noValidate className="flex flex-col gap-4">
        {aviso && <p className="rounded-xl bg-hundida px-4 py-3 text-sm">{aviso}</p>}
        {error && <MensajeError>{error}</MensajeError>}
        <Campo
          etiqueta="Usuario o email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          error={formState.errors.clave?.message}
          {...register('clave')}
        />
        <Boton
          type="submit"
          tamano="grande"
          cargando={formState.isSubmitting}
          className="mt-2 w-full"
        >
          Ingresar
        </Boton>
        <Link
          to="/recuperar"
          className="py-2 text-center text-sm text-suave underline-offset-4 hover:underline"
        >
          Me olvidé la contraseña
        </Link>
      </form>
    </PantallaAcceso>
  )
}
