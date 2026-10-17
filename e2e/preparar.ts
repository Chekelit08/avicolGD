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
    set session_replication_role = origin;
    -- Una cuenta con clave temporal, para probar el primer ingreso.
    delete from public.perfiles where email = 'temporal@avicola.test';
    delete from auth.identities where user_id in (select id from auth.users where email = 'temporal@avicola.test');
    delete from auth.users where email = 'temporal@avicola.test';
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'temporal@avicola.test', extensions.crypt('pollo-asado-1234', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"], "rol": "cajero", "debe_cambiar_clave": true}',
      '{"nombre": "Lucía"}', now(), now(), '', '', '', '');
    update public.perfiles set debe_cambiar_clave = true where email = 'temporal@avicola.test';
  `
  execFileSync('psql', [url, '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'inherit' })
}
