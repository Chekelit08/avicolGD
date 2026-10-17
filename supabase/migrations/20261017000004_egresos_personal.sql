-- =============================================================================
-- Avícola GD — Fase 3: egresos y personal (solo admin)
-- =============================================================================

create type public.tipo_pago_empleado as enum ('sueldo', 'adelanto', 'aguinaldo', 'otro');

-- -----------------------------------------------------------------------------
-- Categorías de egreso
-- -----------------------------------------------------------------------------
create table public.categorias_egreso (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) between 2 and 40),
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categorias_egreso_nombre on public.categorias_egreso (lower(trim(nombre)));

create trigger categorias_egreso_updated_at before update on public.categorias_egreso
  for each row execute function public.tocar_updated_at();

insert into public.categorias_egreso (nombre) values
  ('Alquiler'), ('Mercadería'), ('Servicios'), ('Impuestos'), ('Mantenimiento'), ('Otros');

-- -----------------------------------------------------------------------------
-- Egresos
-- -----------------------------------------------------------------------------
create table public.egresos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  categoria_id uuid not null references public.categorias_egreso (id) on delete restrict,
  descripcion text not null check (length(trim(descripcion)) between 2 and 200),
  proveedor text check (length(proveedor) <= 80),
  monto numeric(12, 2) not null check (monto > 0 and monto <= 999999999),
  medio_pago public.medio_pago not null,
  registrado_por uuid not null references public.perfiles (id) default auth.uid(),
  anulado boolean not null default false,
  anulado_por uuid references public.perfiles (id),
  anulado_en timestamptz,
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint egreso_anulacion_completa check (
    (not anulado and anulado_por is null and anulado_en is null and motivo_anulacion is null)
    or
    (anulado and anulado_por is not null and anulado_en is not null
      and motivo_anulacion is not null and length(trim(motivo_anulacion)) between 3 and 200)
  )
);

create index egresos_fecha on public.egresos (fecha);
create index egresos_categoria on public.egresos (categoria_id);
create index egresos_medio_pago on public.egresos (medio_pago);

create trigger egresos_updated_at before update on public.egresos
  for each row execute function public.tocar_updated_at();

-- Los egresos no se borran ni se des-anulan; quién los cargó no cambia.
create function public.proteger_egresos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Los egresos no se borran: se anulan con un motivo.' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then
    new.registrado_por := coalesce(auth.uid(), new.registrado_por);
    new.anulado := false;
    new.anulado_por := null;
    new.anulado_en := null;
    new.motivo_anulacion := null;
    return new;
  end if;
  if old.anulado then
    raise exception 'Este egreso está anulado y ya no se modifica.' using errcode = 'P0001';
  end if;
  new.registrado_por := old.registrado_por;
  if new.anulado then
    new.anulado_por := coalesce(auth.uid(), new.anulado_por);
    new.anulado_en := now();
  end if;
  return new;
end;
$$;

create trigger egresos_proteger before insert or update or delete on public.egresos
  for each row execute function public.proteger_egresos();

create function public.auditar_egresos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.anulado and not old.anulado then
    perform public.registrar_auditoria('anular_egreso', 'egresos', new.id, to_jsonb(old), to_jsonb(new));
  else
    perform public.registrar_auditoria('editar_egreso', 'egresos', new.id, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;

create trigger egresos_auditar after update on public.egresos
  for each row execute function public.auditar_egresos();

-- -----------------------------------------------------------------------------
-- Empleados y pagos
-- -----------------------------------------------------------------------------
create table public.empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) between 2 and 80),
  activo boolean not null default true,
  fecha_ingreso date,
  nota text check (length(nota) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger empleados_updated_at before update on public.empleados
  for each row execute function public.tocar_updated_at();

create table public.pagos_empleados (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete restrict,
  fecha date not null,
  tipo public.tipo_pago_empleado not null,
  -- Mes al que corresponde el pago, siempre el día 1 (ej. 2026-10-01).
  periodo date not null check (extract(day from periodo) = 1),
  monto numeric(12, 2) not null check (monto > 0 and monto <= 99999999),
  medio_pago public.medio_pago not null,
  nota text check (length(nota) <= 300),
  registrado_por uuid not null references public.perfiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pagos_empleados_empleado on public.pagos_empleados (empleado_id);
create index pagos_empleados_fecha on public.pagos_empleados (fecha);
create index pagos_empleados_periodo on public.pagos_empleados (periodo);
create index pagos_empleados_medio_pago on public.pagos_empleados (medio_pago);

create trigger pagos_empleados_updated_at before update on public.pagos_empleados
  for each row execute function public.tocar_updated_at();

create function public.fijar_registrado_por()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.registrado_por := coalesce(auth.uid(), new.registrado_por);
  else
    new.registrado_por := old.registrado_por;
  end if;
  return new;
end;
$$;

create trigger pagos_empleados_registrado_por before insert or update on public.pagos_empleados
  for each row execute function public.fijar_registrado_por();

create function public.auditar_pagos_empleados()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.registrar_auditoria('borrar_pago', 'pagos_empleados', old.id, to_jsonb(old), null);
    return old;
  end if;
  perform public.registrar_auditoria('editar_pago', 'pagos_empleados', new.id, to_jsonb(old), to_jsonb(new));
  return new;
end;
$$;

create trigger pagos_empleados_auditar after update or delete on public.pagos_empleados
  for each row execute function public.auditar_pagos_empleados();

-- -----------------------------------------------------------------------------
-- RLS: todo esto es solo para administradores.
-- -----------------------------------------------------------------------------
alter table public.categorias_egreso enable row level security;
alter table public.egresos enable row level security;
alter table public.empleados enable row level security;
alter table public.pagos_empleados enable row level security;

create policy categorias_admin_ver on public.categorias_egreso for select to authenticated
  using (public.es_admin());
create policy categorias_admin_crear on public.categorias_egreso for insert to authenticated
  with check (public.es_admin());
create policy categorias_admin_editar on public.categorias_egreso for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy egresos_admin_ver on public.egresos for select to authenticated
  using (public.es_admin());
create policy egresos_admin_crear on public.egresos for insert to authenticated
  with check (public.es_admin());
create policy egresos_admin_editar on public.egresos for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy empleados_admin_ver on public.empleados for select to authenticated
  using (public.es_admin());
create policy empleados_admin_crear on public.empleados for insert to authenticated
  with check (public.es_admin());
create policy empleados_admin_editar on public.empleados for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy pagos_admin_ver on public.pagos_empleados for select to authenticated
  using (public.es_admin());
create policy pagos_admin_crear on public.pagos_empleados for insert to authenticated
  with check (public.es_admin());
create policy pagos_admin_editar on public.pagos_empleados for update to authenticated
  using (public.es_admin()) with check (public.es_admin());
create policy pagos_admin_borrar on public.pagos_empleados for delete to authenticated
  using (public.es_admin());

revoke all on public.categorias_egreso, public.egresos, public.empleados, public.pagos_empleados from anon;

-- -----------------------------------------------------------------------------
-- Reportes de egresos y personal
-- -----------------------------------------------------------------------------

-- Ingresos vs egresos por mes. Personal se cuenta por fecha de pago (caja real).
create function public.ingresos_egresos_mensual(p_desde date, p_hasta date)
returns table (
  mes date,
  ingresos numeric,
  egresos numeric,
  personal numeric,
  ganancia numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.exigir_admin();

  return query
  with meses as (
    select generate_series(date_trunc('month', p_desde), date_trunc('month', p_hasta), interval '1 month')::date as mes
  ),
  ing as (
    select date_trunc('month', j.fecha)::date as mes, sum(v.importe) as total
    from public.ventas v join public.jornadas j on j.id = v.jornada_id
    where not v.anulada and j.fecha between p_desde and p_hasta
    group by 1
  ),
  egr as (
    select date_trunc('month', e.fecha)::date as mes, sum(e.monto) as total
    from public.egresos e
    where not e.anulado and e.fecha between p_desde and p_hasta
    group by 1
  ),
  per as (
    select date_trunc('month', p.fecha)::date as mes, sum(p.monto) as total
    from public.pagos_empleados p
    where p.fecha between p_desde and p_hasta
    group by 1
  )
  select m.mes,
         coalesce(ing.total, 0),
         coalesce(egr.total, 0),
         coalesce(per.total, 0),
         coalesce(ing.total, 0) - coalesce(egr.total, 0) - coalesce(per.total, 0)
  from meses m
  left join ing on ing.mes = m.mes
  left join egr on egr.mes = m.mes
  left join per on per.mes = m.mes
  order by m.mes;
end;
$$;

create function public.egresos_por_categoria(p_desde date, p_hasta date)
returns table (
  categoria_id uuid,
  categoria text,
  total numeric,
  cantidad bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.exigir_admin();

  return query
  select c.id, c.nombre, sum(e.monto), count(*)
  from public.egresos e
  join public.categorias_egreso c on c.id = e.categoria_id
  where not e.anulado and e.fecha between p_desde and p_hasta
  group by c.id, c.nombre
  order by sum(e.monto) desc;
end;
$$;

-- Lo pagado a cada empleado en un mes (por período al que corresponde).
create function public.personal_del_mes(p_periodo date)
returns table (
  empleado_id uuid,
  nombre text,
  activo boolean,
  sueldo numeric,
  adelanto numeric,
  aguinaldo numeric,
  otro numeric,
  total numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.exigir_admin();

  return query
  select e.id, e.nombre, e.activo,
         coalesce(sum(p.monto) filter (where p.tipo = 'sueldo'), 0),
         coalesce(sum(p.monto) filter (where p.tipo = 'adelanto'), 0),
         coalesce(sum(p.monto) filter (where p.tipo = 'aguinaldo'), 0),
         coalesce(sum(p.monto) filter (where p.tipo = 'otro'), 0),
         coalesce(sum(p.monto), 0)
  from public.empleados e
  left join public.pagos_empleados p
    on p.empleado_id = e.id and p.periodo = date_trunc('month', p_periodo)::date
  where e.activo or p.id is not null
  group by e.id, e.nombre, e.activo
  order by e.nombre;
end;
$$;

grant execute on function
  public.ingresos_egresos_mensual(date, date),
  public.egresos_por_categoria(date, date),
  public.personal_del_mes(date)
to authenticated;
