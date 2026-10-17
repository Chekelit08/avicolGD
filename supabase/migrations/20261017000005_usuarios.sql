-- =============================================================================
-- Avícola GD — Fase 3: gestión de usuarios
-- El email se copia al perfil para poder listarlo sin acceso a auth.users.
-- Crear usuarios y cambiar contraseñas lo hace la Edge Function `usuarios`
-- (necesita la clave de servicio, que nunca va al navegador).
-- =============================================================================

alter table public.perfiles add column email text;

update public.perfiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, email, rol, debe_cambiar_clave)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_app_meta_data ->> 'rol')::public.rol_usuario, 'cajero'),
    coalesce((new.raw_app_meta_data ->> 'debe_cambiar_clave')::boolean, false)
  );
  return new;
end;
$$;

-- Lo que un admin puede cambiar desde la app es el nombre, el rol y si está activo.
-- El id, el email y la marca de clave temporal los maneja el servidor.
create function public.proteger_campos_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and current_user = 'authenticated' then
    new.id := old.id;
    new.email := old.email;
    if new.debe_cambiar_clave and not old.debe_cambiar_clave then
      new.debe_cambiar_clave := old.debe_cambiar_clave;
    end if;
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger_campos before update on public.perfiles
  for each row execute function public.proteger_campos_perfil();

-- La Edge Function corre con la clave de servicio (sin auth.uid()); registra a nombre del admin que la llamó.
create function public.registrar_auditoria_servicio(
  p_actor uuid, p_accion text, p_registro uuid, p_despues jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.auditoria (usuario_id, usuario_nombre, accion, tabla, registro_id, antes, despues)
  values (
    p_actor,
    (select nombre from public.perfiles where id = p_actor),
    p_accion, 'perfiles', p_registro, null, p_despues
  );
end;
$$;

revoke execute on function public.registrar_auditoria_servicio(uuid, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_auditoria_servicio(uuid, text, uuid, jsonb) to service_role;
