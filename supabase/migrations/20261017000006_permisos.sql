-- =============================================================================
-- Avícola GD — Endurecer permisos de funciones (revisión del linter de Supabase)
-- Las funciones de trigger y las internas no se tienen que poder llamar por la API.
-- Quedan expuestas solo las operaciones de la app y los helpers que usan las políticas RLS.
-- =============================================================================

revoke execute on all functions in schema public from public, anon;

revoke execute on function
  public.tocar_updated_at(),
  public.crear_perfil_de_usuario(),
  public.sincronizar_perfil_de_usuario(),
  public.proteger_ventas(),
  public.proteger_egresos(),
  public.proteger_campos_perfil(),
  public.proteger_ultimo_admin(),
  public.fijar_registrado_por(),
  public.auditoria_inmutable(),
  public.auditar_ventas(),
  public.auditar_jornadas(),
  public.auditar_perfiles(),
  public.auditar_egresos(),
  public.auditar_pagos_empleados(),
  public.registrar_auditoria(text, text, uuid, jsonb, jsonb)
from authenticated;

-- auth.uid() evaluado una sola vez por consulta (linter: auth_rls_initplan).
alter policy perfiles_ver_propio on public.perfiles using (id = (select auth.uid()));
