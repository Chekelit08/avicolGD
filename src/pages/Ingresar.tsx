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
import { useSesion } from '../sesion/Sesion'

const esquema = z.object({
  email: z.email('Escribí un email válido, por ejemplo nombre@gmail.com'),
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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 rounded-2xl bg-white p-5">
        <img src={logo} alt="Gonza — Carnicería, Chanchería, Avícola" className="mx-auto w-56" />
      </div>
      <h1 className="mb-1 text-center font-cartel text-4xl font-extrabold uppercase">Avícola GD</h1>
      <p className="mb-6 text-center text-suave">{titulo}</p>
      {children}
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
      const { error: e } = await supabase().auth.signInWithPassword({ email, password: clave })
      if (e) {
        setError(esErrorDeRed(e) ? MENSAJE_SIN_INTERNET : 'El email o la contraseña no coinciden.')
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
    <PantallaAcceso titulo="Ingresá para abrir la caja">
      <form onSubmit={ingresar} noValidate className="flex flex-col gap-4">
        {aviso && <p className="rounded-xl bg-hundida px-4 py-3 text-sm">{aviso}</p>}
        {error && <MensajeError>{error}</MensajeError>}
        <Campo
          etiqueta="Email"
          type="email"
          autoComplete="username"
          inputMode="email"
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
        <Boton type="submit" cargando={formState.isSubmitting} className="mt-2 h-14 text-lg">
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
