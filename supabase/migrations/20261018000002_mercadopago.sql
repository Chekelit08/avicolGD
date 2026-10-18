-- =============================================================================
-- Avícola GD — Cobros de Mercado Pago que se cargan solos
-- La Edge Function `mercadopago` recibe el aviso de MP (webhook) o barre los
-- últimos cobros, y llama a registrar_cobro_mp con la clave de servicio.
-- Cada cobro aprobado se guarda una sola vez (id_mp único) y, si el día de hoy
-- está abierto, entra como venta digital con origen "mercadopago".
-- =============================================================================

create type public.origen_venta as enum ('manual', 'mercadopago');
create type public.estado_cobro_mp as enum ('pendiente', 'cargado', 'descartado');

alter table public.configuracion
  add column mp_automatico boolean not null default true;

-- -----------------------------------------------------------------------------
-- Ventas: origen. Las de Mercado Pago no las carga una persona.
-- -----------------------------------------------------------------------------
alter table public.ventas
  add column origen public.origen_venta not null default 'manual',
  alter column registrada_por drop not null,
  add constraint venta_quien_la_cargo check ((origen = 'manual') = (registrada_por is not null));

create or replace function public.proteger_ventas()
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
      or new.medio_pago <> old.medio_pago or new.origen <> old.origen
      or new.registrada_por is distinct from old.registrada_por
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

-- Un cajero no anula ventas que no cargó su cuenta (las de Mercado Pago no tienen cuenta).
create or replace function public.anular_venta(p_venta_id uuid, p_motivo text)
returns public.ventas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_venta public.ventas;
  v_estado public.estado_jornada;
begin
  perform public.exigir_usuario_activo();

  if p_motivo is null or length(trim(p_motivo)) < 3 then
    raise exception 'Escribí el motivo de la anulación (al menos 3 letras).' using errcode = 'P0001';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id for update;
  if not found then
    raise exception 'No encontramos esa venta.' using errcode = 'P0002';
  end if;

  select estado into v_estado from public.jornadas where id = v_venta.jornada_id;
  if v_estado = 'cerrada' then
    raise exception 'El día está cerrado: no se pueden anular ventas. Un administrador puede reabrirlo.'
      using errcode = 'P0001';
  end if;

  if v_venta.anulada then
    raise exception 'Esta venta ya estaba anulada.' using errcode = 'P0001';
  end if;

  if not public.es_admin() then
    if v_venta.registrada_por is distinct from auth.uid() then
      raise exception 'Solo un administrador puede anular ventas cargadas por otra cuenta.'
        using errcode = '42501';
    end if;
    if v_venta.registrada_en < now() - interval '10 minutes' then
      raise exception 'Pasaron más de 10 minutos: solo un administrador puede anular esta venta.'
        using errcode = '42501';
    end if;
  end if;

  update public.ventas
  set anulada = true, anulada_por = auth.uid(), anulada_en = now(),
      motivo_anulacion = trim(p_motivo)
  where id = p_venta_id
  returning * into v_venta;

  return v_venta;
end;
$$;

-- -----------------------------------------------------------------------------
-- Cobros recibidos en Mercado Pago
-- -----------------------------------------------------------------------------
create table public.cobros_mp (
  id uuid primary key default gen_random_uuid(),
  id_mp text not null unique check (length(id_mp) between 1 and 40),
  importe numeric(12, 2) not null check (importe > 0),
  pagado_en timestamptz not null,
  tipo text check (length(tipo) <= 40),
  descripcion text check (length(descripcion) <= 200),
  pagador text check (length(pagador) <= 120),
  estado public.estado_cobro_mp not null default 'pendiente',
  -- La venta que lo representa: la que creó o una que ya había tipeado el cajero.
  venta_id uuid unique references public.ventas (id) on delete restrict,
  resuelto_por uuid references public.perfiles (id),
  resuelto_en timestamptz,
  motivo_descarte text check (length(motivo_descarte) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cobro_mp_estado_completo check (
    (estado = 'cargado' and venta_id is not null)
    or (estado = 'pendiente' and venta_id is null)
    or (estado = 'descartado' and venta_id is null and motivo_descarte is not null)
  )
);

create index cobros_mp_estado on public.cobros_mp (estado);
create index cobros_mp_pagado_en on public.cobros_mp (pagado_en desc);

create trigger cobros_mp_updated_at before update on public.cobros_mp
  for each row execute function public.tocar_updated_at();

alter table public.cobros_mp enable row level security;
create policy cobros_mp_ver_admin on public.cobros_mp for select to authenticated
  using (public.es_admin());
revoke all on public.cobros_mp from anon;

-- Si el cajero ya tipeó esa venta digital (mismo importe, últimos 15 minutos, sin
-- otro cobro asociado), el cobro se asocia a ella en vez de cargarla dos veces.
create function public.venta_para_cobro(p_jornada_id uuid, p_importe numeric)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select v.id
  from public.ventas v
  where v.jornada_id = p_jornada_id
    and v.origen = 'manual'
    and v.medio_pago = 'digital'
    and not v.anulada
    and v.importe = p_importe
    and v.registrada_en >= now() - interval '15 minutes'
    and not exists (select 1 from public.cobros_mp c where c.venta_id = v.id)
  order by v.registrada_en desc
  limit 1;
$$;

-- Pasa un cobro pendiente a venta del día abierto de hoy. Devuelve false si no se pudo.
create function public.cargar_cobro_en_caja(p_cobro_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cobro public.cobros_mp;
  v_jornada public.jornadas;
  v_venta uuid;
begin
  select * into v_cobro from public.cobros_mp where id = p_cobro_id for update;
  if not found or v_cobro.estado <> 'pendiente' or v_cobro.importe > 9999999 then
    return false;
  end if;
  select * into v_jornada from public.jornadas where estado = 'abierta' and fecha = public.hoy_ar();
  if not found then
    return false;
  end if;

  v_venta := public.venta_para_cobro(v_jornada.id, v_cobro.importe);
  if v_venta is null then
    insert into public.ventas (jornada_id, importe, medio_pago, origen, registrada_por)
    values (v_jornada.id, v_cobro.importe, 'digital', 'mercadopago', null)
    returning id into v_venta;
  end if;

  update public.cobros_mp
  set estado = 'cargado', venta_id = v_venta, resuelto_por = auth.uid(), resuelto_en = now()
  where id = p_cobro_id;
  return true;
end;
$$;

-- Lo llama la Edge Function con la clave de servicio. Idempotente por id_mp.
create function public.registrar_cobro_mp(
  p_id_mp text,
  p_importe numeric,
  p_pagado_en timestamptz,
  p_tipo text default null,
  p_descripcion text default null,
  p_pagador text default null
)
returns public.cobros_mp
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cobro public.cobros_mp;
  v_automatico boolean;
begin
  if p_id_mp is null or p_importe is null or p_importe <= 0 or p_pagado_en is null then
    raise exception 'Cobro de Mercado Pago incompleto.' using errcode = 'P0001';
  end if;

  -- Si llegan dos avisos del mismo cobro a la vez, uno espera al otro.
  perform pg_advisory_xact_lock(hashtext('cobro_mp:' || p_id_mp));

  select * into v_cobro from public.cobros_mp where id_mp = p_id_mp;
  if found then
    return v_cobro;
  end if;

  insert into public.cobros_mp (id_mp, importe, pagado_en, tipo, descripcion, pagador)
  values (
    p_id_mp, round(p_importe, 2), p_pagado_en,
    left(p_tipo, 40), left(nullif(trim(p_descripcion), ''), 200), left(nullif(trim(p_pagador), ''), 120)
  )
  returning * into v_cobro;

  select mp_automatico into v_automatico from public.configuracion limit 1;
  -- Solo se carga solo si es de hoy: uno de un día cerrado lo resuelve el admin.
  if coalesce(v_automatico, true)
    and (p_pagado_en at time zone 'America/Argentina/Buenos_Aires')::date = public.hoy_ar() then
    perform public.cargar_cobro_en_caja(v_cobro.id);
  end if;

  select * into v_cobro from public.cobros_mp where id = v_cobro.id;
  return v_cobro;
end;
$$;

-- Al abrir el día entran los cobros de hoy que llegaron con la caja cerrada.
create or replace function public.abrir_jornada(p_fondo_inicial numeric default 0)
returns public.jornadas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_abierta public.jornadas;
  v_hoy date := public.hoy_ar();
  v_nueva public.jornadas;
  v_cobro public.cobros_mp;
begin
  perform public.exigir_usuario_activo();

  if p_fondo_inicial is null or p_fondo_inicial < 0 then
    raise exception 'El fondo de caja no puede ser negativo.' using errcode = 'P0001';
  end if;

  select * into v_abierta from public.jornadas where estado = 'abierta' for update;
  if found then
    if v_abierta.fecha = v_hoy then
      raise exception 'El día de hoy ya está abierto.' using errcode = 'P0001';
    end if;
    raise exception 'Quedó abierto el día %. Cerralo antes de abrir uno nuevo.',
      to_char(v_abierta.fecha, 'DD/MM') using errcode = 'P0001';
  end if;

  if exists (select 1 from public.jornadas where fecha = v_hoy) then
    raise exception 'El día de hoy ya se cerró. Si hay que corregir algo, un administrador puede reabrirlo.'
      using errcode = 'P0001';
  end if;

  insert into public.jornadas (fecha, fondo_inicial, abierta_por)
  values (v_hoy, round(p_fondo_inicial, 2), auth.uid())
  returning * into v_nueva;

  if (select mp_automatico from public.configuracion limit 1) then
    for v_cobro in
      select * from public.cobros_mp
      where estado = 'pendiente'
        and (pagado_en at time zone 'America/Argentina/Buenos_Aires')::date = v_hoy
      order by pagado_en
    loop
      perform public.cargar_cobro_en_caja(v_cobro.id);
    end loop;
  end if;

  return v_nueva;
end;
$$;

-- El admin decide qué hacer con un cobro que quedó pendiente.
create function public.resolver_cobro_mp(p_cobro_id uuid, p_cargar boolean, p_motivo text default null)
returns public.cobros_mp
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cobro public.cobros_mp;
begin
  perform public.exigir_admin();

  select * into v_cobro from public.cobros_mp where id = p_cobro_id for update;
  if not found then
    raise exception 'No encontramos ese cobro.' using errcode = 'P0002';
  end if;
  if v_cobro.estado <> 'pendiente' then
    raise exception 'Ese cobro ya se resolvió.' using errcode = 'P0001';
  end if;

  if p_cargar then
    if not public.cargar_cobro_en_caja(v_cobro.id) then
      raise exception 'Para cargarlo tiene que estar abierto el día de hoy.' using errcode = 'P0001';
    end if;
  else
    if p_motivo is null or length(trim(p_motivo)) < 3 then
      raise exception 'Escribí por qué no se carga (al menos 3 letras).' using errcode = 'P0001';
    end if;
    update public.cobros_mp
    set estado = 'descartado', motivo_descarte = trim(p_motivo),
        resuelto_por = auth.uid(), resuelto_en = now()
    where id = p_cobro_id;
  end if;

  select * into v_cobro from public.cobros_mp where id = p_cobro_id;
  perform public.registrar_auditoria(
    case when p_cargar then 'cargar_cobro_mp' else 'descartar_cobro_mp' end,
    'cobros_mp', v_cobro.id, null, to_jsonb(v_cobro)
  );
  return v_cobro;
end;
$$;

-- -----------------------------------------------------------------------------
-- Barrido de respaldo cada 5 minutos (por si se pierde un aviso de MP).
-- Solo corre si están cargados en Vault la URL de la función y su secreto:
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/mercadopago', 'mp_funcion_url');
--   select vault.create_secret('<secreto largo al azar>', 'mp_barrido_secreto');
-- (el mismo secreto va como BARRIDO_SECRETO en los secretos de la función).
-- -----------------------------------------------------------------------------
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create function public.barrer_mercadopago()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secreto text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'mp_funcion_url';
  select decrypted_secret into v_secreto from vault.decrypted_secrets where name = 'mp_barrido_secreto';
  if v_url is null or v_secreto is null then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-barrido', v_secreto),
    body := '{"accion":"barrer"}'::jsonb
  );
end;
$$;

select cron.schedule('barrer-mercadopago', '*/5 * * * *', 'select public.barrer_mercadopago()');

-- -----------------------------------------------------------------------------
-- El resumen del día separa lo que entró por Mercado Pago (es parte del digital).
-- -----------------------------------------------------------------------------
drop function public.resumen_jornada(uuid);
create function public.resumen_jornada(p_jornada_id uuid)
returns table (
  jornada_id uuid,
  fecha date,
  estado public.estado_jornada,
  total numeric,
  total_efectivo numeric,
  total_digital numeric,
  total_mercadopago numeric,
  cantidad_mercadopago bigint,
  cantidad_ventas bigint,
  cantidad_efectivo bigint,
  cantidad_digital bigint,
  cantidad_anuladas bigint,
  ticket_promedio numeric,
  fondo_inicial numeric,
  total_salidas numeric,
  cantidad_salidas bigint,
  efectivo_esperado numeric,
  efectivo_contado numeric,
  diferencia_efectivo numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    j.id,
    j.fecha,
    j.estado,
    coalesce(sum(v.importe) filter (where not v.anulada), 0),
    coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'efectivo'), 0),
    coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'digital'), 0),
    coalesce(sum(v.importe) filter (where not v.anulada and v.origen = 'mercadopago'), 0),
    count(v.id) filter (where not v.anulada and v.origen = 'mercadopago'),
    count(v.id) filter (where not v.anulada),
    count(v.id) filter (where not v.anulada and v.medio_pago = 'efectivo'),
    count(v.id) filter (where not v.anulada and v.medio_pago = 'digital'),
    count(v.id) filter (where v.anulada),
    coalesce(round(avg(v.importe) filter (where not v.anulada), 2), 0),
    j.fondo_inicial,
    coalesce((select sum(s.importe) from public.salidas_caja s where s.jornada_id = j.id and not s.anulada), 0),
    (select count(*) from public.salidas_caja s where s.jornada_id = j.id and not s.anulada),
    public.efectivo_esperado(j.id),
    j.efectivo_contado,
    j.diferencia_efectivo
  from public.jornadas j
  left join public.ventas v on v.jornada_id = j.id
  where j.id = p_jornada_id
    and (public.es_admin() or (public.usuario_activo() and (j.estado = 'abierta' or j.fecha = public.hoy_ar())))
  group by j.id;
$$;

revoke execute on function public.resumen_jornada(uuid) from public, anon;
grant execute on function public.resumen_jornada(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Permisos
-- -----------------------------------------------------------------------------
revoke execute on function
  public.venta_para_cobro(uuid, numeric),
  public.cargar_cobro_en_caja(uuid),
  public.registrar_cobro_mp(text, numeric, timestamptz, text, text, text),
  public.barrer_mercadopago()
from public, anon, authenticated;
grant execute on function
  public.registrar_cobro_mp(text, numeric, timestamptz, text, text, text)
to service_role;

revoke execute on function public.resolver_cobro_mp(uuid, boolean, text) from public, anon;
grant execute on function public.resolver_cobro_mp(uuid, boolean, text) to authenticated;
