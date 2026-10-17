-- =============================================================================
-- Avícola GD — Fase 1: base del esquema
-- Perfiles y roles, configuración, jornadas, ventas y auditoría.
-- Los permisos se aplican con RLS; las operaciones con reglas de negocio
-- (abrir, vender, anular, cerrar, reabrir) van por funciones en 20261017000002.
-- =============================================================================

create type public.rol_usuario as enum ('cajero', 'admin');
create type public.medio_pago as enum ('efectivo', 'digital');
create type public.estado_jornada as enum ('abierta', 'cerrada');

-- -----------------------------------------------------------------------------
-- Utilidades
-- -----------------------------------------------------------------------------

create function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Fecha de trabajo en Buenos Aires (la base corre en UTC).
create function public.hoy_ar()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date;
$$;

-- -----------------------------------------------------------------------------
-- Perfiles: extiende auth.users
-- -----------------------------------------------------------------------------

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete restrict,
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  rol public.rol_usuario not null default 'cajero',
  activo boolean not null default true,
  debe_cambiar_clave boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger perfiles_updated_at before update on public.perfiles
  for each row execute function public.tocar_updated_at();

-- El perfil se crea solo cuando un admin crea el usuario (el registro público está cerrado).
-- El rol viene de app_metadata, que solo puede escribir el servidor; user_metadata no es confiable.
create function public.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, rol, debe_cambiar_clave)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_app_meta_data ->> 'rol')::public.rol_usuario, 'cajero'),
    coalesce((new.raw_app_meta_data ->> 'debe_cambiar_clave')::boolean, false)
  );
  return new;
end;
$$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil_de_usuario();

-- Helpers de permisos. security definer para que no dependan del RLS de perfiles.
create function public.usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and activo);
$$;

create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and activo and rol = 'admin');
$$;

-- -----------------------------------------------------------------------------
-- Configuración (una sola fila)
-- -----------------------------------------------------------------------------

create table public.configuracion (
  id uuid primary key default gen_random_uuid(),
  unica boolean not null default true unique check (unica),
  tope_confirmacion numeric(12, 2) not null default 500000 check (tope_confirmacion > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger configuracion_updated_at before update on public.configuracion
  for each row execute function public.tocar_updated_at();

insert into public.configuracion default values;

-- -----------------------------------------------------------------------------
-- Jornadas: un día de trabajo
-- -----------------------------------------------------------------------------

create table public.jornadas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  estado public.estado_jornada not null default 'abierta',
  fondo_inicial numeric(12, 2) not null default 0 check (fondo_inicial >= 0),
  abierta_por uuid not null references public.perfiles (id),
  abierta_en timestamptz not null default now(),
  cerrada_por uuid references public.perfiles (id),
  cerrada_en timestamptz,
  efectivo_contado numeric(12, 2) check (efectivo_contado >= 0),
  diferencia_efectivo numeric(12, 2),
  nota_cierre text check (length(nota_cierre) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jornada_cierre_completo check (
    (estado = 'abierta' and cerrada_por is null and cerrada_en is null
      and efectivo_contado is null and diferencia_efectivo is null)
    or
    (estado = 'cerrada' and cerrada_por is not null and cerrada_en is not null
      and efectivo_contado is not null and diferencia_efectivo is not null)
  )
);

-- Regla 1: una sola jornada abierta a la vez.
create unique index jornadas_una_abierta on public.jornadas ((true)) where estado = 'abierta';
create index jornadas_estado on public.jornadas (estado);

create trigger jornadas_updated_at before update on public.jornadas
  for each row execute function public.tocar_updated_at();

-- -----------------------------------------------------------------------------
-- Ventas: importe + medio de pago. No se borran, se anulan.
-- -----------------------------------------------------------------------------

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references public.jornadas (id) on delete restrict,
  importe numeric(12, 2) not null check (importe > 0 and importe <= 9999999),
  medio_pago public.medio_pago not null,
  registrada_por uuid not null references public.perfiles (id),
  registrada_en timestamptz not null default now(),
  anulada boolean not null default false,
  anulada_por uuid references public.perfiles (id),
  anulada_en timestamptz,
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venta_anulacion_completa check (
    (not anulada and anulada_por is null and anulada_en is null and motivo_anulacion is null)
    or
    (anulada and anulada_por is not null and anulada_en is not null
      and motivo_anulacion is not null and length(trim(motivo_anulacion)) between 3 and 200)
  )
);

create index ventas_jornada on public.ventas (jornada_id);
create index ventas_medio_pago on public.ventas (medio_pago);
create index ventas_registrada_en on public.ventas (registrada_en);

create trigger ventas_updated_at before update on public.ventas
  for each row execute function public.tocar_updated_at();

-- Regla 2 y 3: nada se carga ni se modifica en una jornada cerrada. Las ventas no se borran.
create function public.proteger_ventas()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_estado public.estado_jornada;
begin
  if tg_op = 'DELETE' then
    raise exception 'Las ventas no se borran: se anulan con un motivo.' using errcode = 'P0001';
  end if;

  select estado into v_estado from public.jornadas where id = new.jornada_id;
  if v_estado = 'cerrada' then
    raise exception 'El día está cerrado: no se pueden cargar ni modificar ventas. Un administrador puede reabrirlo.'
      using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' then
    -- Lo único que cambia de una venta es su anulación, y no tiene vuelta atrás.
    if new.jornada_id <> old.jornada_id or new.importe <> old.importe
      or new.medio_pago <> old.medio_pago or new.registrada_por <> old.registrada_por
      or new.registrada_en <> old.registrada_en then
      raise exception 'Una venta no se edita: anulala y cargala de nuevo.' using errcode = 'P0001';
    end if;
    if old.anulada then
      raise exception 'Esta venta ya estaba anulada.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger ventas_proteger before insert or update or delete on public.ventas
  for each row execute function public.proteger_ventas();

-- -----------------------------------------------------------------------------
-- Auditoría: solo se agrega, nunca se edita ni se borra.
-- -----------------------------------------------------------------------------

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.perfiles (id),
  usuario_nombre text,
  accion text not null,
  tabla text not null,
  registro_id uuid,
  antes jsonb,
  despues jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index auditoria_created_at on public.auditoria (created_at desc);
create index auditoria_registro on public.auditoria (tabla, registro_id);

create function public.auditoria_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La auditoría no se modifica ni se borra.' using errcode = 'P0001';
end;
$$;

create trigger auditoria_sin_cambios before update or delete on public.auditoria
  for each row execute function public.auditoria_inmutable();

create function public.registrar_auditoria(
  p_accion text, p_tabla text, p_registro uuid, p_antes jsonb, p_despues jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.auditoria (usuario_id, usuario_nombre, accion, tabla, registro_id, antes, despues)
  values (
    auth.uid(),
    (select nombre from public.perfiles where id = auth.uid()),
    p_accion, p_tabla, p_registro, p_antes, p_despues
  );
end;
$$;

revoke execute on function public.registrar_auditoria(text, text, uuid, jsonb, jsonb) from public, anon, authenticated;

-- Triggers de auditoría
create function public.auditar_ventas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.anulada and not old.anulada then
    perform public.registrar_auditoria('anular_venta', 'ventas', new.id, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;

create trigger ventas_auditar after update on public.ventas
  for each row execute function public.auditar_ventas();

create function public.auditar_jornadas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.estado = 'cerrada' and new.estado = 'abierta' then
    perform public.registrar_auditoria('reabrir_jornada', 'jornadas', new.id, to_jsonb(old), to_jsonb(new));
  elsif old.estado = 'abierta' and new.estado = 'cerrada' then
    perform public.registrar_auditoria('cerrar_jornada', 'jornadas', new.id, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;

create trigger jornadas_auditar after update on public.jornadas
  for each row execute function public.auditar_jornadas();

create function public.auditar_perfiles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.rol <> old.rol then
    perform public.registrar_auditoria('cambiar_rol', 'perfiles', new.id, to_jsonb(old), to_jsonb(new));
  end if;
  if old.activo and not new.activo then
    perform public.registrar_auditoria('desactivar_usuario', 'perfiles', new.id, to_jsonb(old), to_jsonb(new));
  elsif not old.activo and new.activo then
    perform public.registrar_auditoria('reactivar_usuario', 'perfiles', new.id, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;

create trigger perfiles_auditar after update on public.perfiles
  for each row execute function public.auditar_perfiles();

-- Siempre tiene que quedar al menos un admin activo.
create function public.proteger_ultimo_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.rol = 'admin' and old.activo and (new.rol <> 'admin' or not new.activo) then
    if not exists (
      select 1 from public.perfiles where rol = 'admin' and activo and id <> old.id
    ) then
      raise exception 'Tiene que quedar al menos un administrador activo.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger perfiles_ultimo_admin before update on public.perfiles
  for each row execute function public.proteger_ultimo_admin();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.perfiles enable row level security;
alter table public.configuracion enable row level security;
alter table public.jornadas enable row level security;
alter table public.ventas enable row level security;
alter table public.auditoria enable row level security;

-- Perfiles: cada uno ve el suyo; el admin ve y edita todos.
create policy perfiles_ver_propio on public.perfiles for select to authenticated
  using (id = auth.uid());
create policy perfiles_ver_admin on public.perfiles for select to authenticated
  using (public.es_admin());
create policy perfiles_editar_admin on public.perfiles for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Configuración: la leen todos los usuarios activos, la cambia el admin.
create policy configuracion_ver on public.configuracion for select to authenticated
  using (public.usuario_activo());
create policy configuracion_editar on public.configuracion for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Jornadas: el cajero ve solo la abierta y la de hoy. El admin, todas.
-- Abrir, cerrar y reabrir van por funciones; no hay insert/update directos.
create policy jornadas_ver_cajero on public.jornadas for select to authenticated
  using (public.usuario_activo() and (estado = 'abierta' or fecha = public.hoy_ar()));
create policy jornadas_ver_admin on public.jornadas for select to authenticated
  using (public.es_admin());

-- Ventas: el cajero ve las de la jornada abierta. El admin, todas.
-- Cargar y anular van por funciones; no hay insert/update/delete directos.
create policy ventas_ver_cajero on public.ventas for select to authenticated
  using (
    public.usuario_activo()
    and exists (select 1 from public.jornadas j where j.id = jornada_id and j.estado = 'abierta')
  );
create policy ventas_ver_admin on public.ventas for select to authenticated
  using (public.es_admin());

-- Auditoría: solo el admin la lee.
create policy auditoria_ver_admin on public.auditoria for select to authenticated
  using (public.es_admin());

-- Los usuarios anónimos no ven nada.
revoke all on all tables in schema public from anon;
