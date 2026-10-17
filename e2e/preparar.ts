import { execFileSync } from 'node:child_process'

/**
 * Deja la base local lista para el flujo: sin jornada de hoy ni abiertas.
 * Requiere `npx supabase start` + `npx supabase db reset` (usuarios y datos de prueba del seed).
 */
export default function preparar() {
  const url = process.env.E2E_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  const sql = `
    set session_replication_role = replica;
    delete from public.ventas where jornada_id in (select id from public.jornadas where fecha >= public.hoy_ar() or estado = 'abierta');
    delete from public.jornadas where fecha >= public.hoy_ar() or estado = 'abierta';
  `
  execFileSync('psql', [url, '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'inherit' })
}
