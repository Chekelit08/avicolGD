-- =============================================================================
-- Avícola GD — Una cuenta solo queda activa si la creó un admin o el servidor.
-- Si el registro público quedara prendido por error, quien se registre solo
-- entra como usuario INACTIVO: no ve ni carga nada (todas las políticas exigen activo).
-- El rol en app_metadata solo lo puede escribir el servidor (Edge Function o scripts).
-- =============================================================================

create or replace function public.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, email, rol, activo, debe_cambiar_clave)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_app_meta_data ->> 'rol')::public.rol_usuario, 'cajero'),
    (new.raw_app_meta_data ->> 'rol') is not null,
    coalesce((new.raw_app_meta_data ->> 'debe_cambiar_clave')::boolean, false)
  );
  return new;
end;
$$;

create or replace function public.sincronizar_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.raw_app_meta_data ->> 'rol') is distinct from (old.raw_app_meta_data ->> 'rol')
    or (new.raw_app_meta_data ->> 'debe_cambiar_clave') is distinct from (old.raw_app_meta_data ->> 'debe_cambiar_clave') then
    perform set_config('avicola.sincronizando', 'si', true);
    update public.perfiles
    set rol = coalesce((new.raw_app_meta_data ->> 'rol')::public.rol_usuario, rol),
        debe_cambiar_clave = coalesce((new.raw_app_meta_data ->> 'debe_cambiar_clave')::boolean, debe_cambiar_clave),
        -- El alta hecha por el servidor (primera vez que aparece el rol) activa la cuenta.
        activo = case
          when (old.raw_app_meta_data ->> 'rol') is null and (new.raw_app_meta_data ->> 'rol') is not null then true
          else activo
        end
    where id = new.id;
    perform set_config('avicola.sincronizando', '', true);
  end if;
  return new;
end;
$$;

revoke execute on function public.crear_perfil_de_usuario(), public.sincronizar_perfil_de_usuario()
  from public, anon, authenticated;
