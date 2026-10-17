import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cliente: SupabaseClient | undefined

/**
 * Cliente de Supabase con la clave PÚBLICA. La seguridad está en las políticas RLS.
 * Se crea recién cuando se usa, así la app arranca aunque falte configurar .env.local.
 */
export function supabase(): SupabaseClient {
  if (cliente) return cliente
  const url = import.meta.env.VITE_SUPABASE_URL
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !clave) {
    throw new Error(
      'Falta configurar Supabase: copiá .env.example como .env.local y completá la URL y la clave pública.',
    )
  }
  cliente = createClient(url, clave, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return cliente
}
