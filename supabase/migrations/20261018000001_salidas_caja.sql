-- =============================================================================
-- Avícola GD — Salidas de efectivo de la caja
-- Pagarle al proveedor o sacar plata con el día abierto. Se restan del efectivo
-- esperado (regla 7). Las de proveedor o gasto del local también quedan como
-- egreso, para que el dueño las vea en sus reportes sin cargarlas dos veces.
-- =============================================================================

create type public.motivo_salida as enum ('proveedor', 'retiro', 'gasto', 'otro');

create table public.salidas_caja (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references public.jornadas (id) on delete restrict,
  importe numeric(12, 2) not null check (importe > 0 and importe <= 9999999),
  motivo public.motivo_salida not null,
  detalle text check (length(detalle) <= 120),
  registrada_por uuid not null references public.perfiles (id),
  registrada_en timestamptz not null default now(),
  anulada boolean not null default false,
  anulada_por uuid references public.perfiles (id),
  anulada_en timestamptz,
  motivo_anulacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salida_anulacion_completa check (
    (not anulada and anulada_por is null and anulada_en is null and motivo_anulacion is null)
    or
    (anulada and anulada_por is not null and anulada_en is not null
      and motivo_anulacion is not null and length(trim(motivo_anulacion)) between 3 and 200)
  )
);

create index salidas_caja_jornada on public.salidas_caja (jornada_id);

create trigger salidas_caja_updated_at before update on public.salidas_caja
  for each row execute function public.tocar_updated_at();

-- Igual que las ventas: no se borran, no se editan y nada cambia en un día cerrado.
create function public.proteger_salidas()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_estado public.estado_jornada;
begin
  if tg_op = 'DELETE' then
    raise exception 'Las salidas de caja no se borran: se anulan con un motivo.' using errcode = 'P0001';
  end if;

  select estado into v_estado from public.jornadas where id = new.jornada_id;
  if v_estado = 'cerrada' then
    raise exception 'El día está cerrado: no se pueden cargar ni modificar salidas. Un administrador puede reabrirlo.'
      using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' then
    if new.jornada_id <> old.jornada_id or new.importe <> old.importe or new.motivo <> old.motivo
      or new.detalle is distinct from old.detalle or new.registrada_por <> old.registrada_por
      or new.registrada_en <> old.registrada_en then
      raise exception 'Una salida no se edita: anulala y cargala de nuevo.' using errcode = 'P0001';
    end if;
    if old.anulada then
      raise exception 'Esta salida ya estaba anulada.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger salidas_caja_proteger before insert or update or delete on public.salidas_caja
  for each row execute function public.proteger_salidas();

create function public.auditar_salidas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.registrar_auditoria('sacar_efectivo', 'salidas_caja', new.id, null, to_jsonb(new));
  elsif new.anulada and not old.anulada then
    perform public.registrar_auditoria('anular_salida', 'salidas_caja', new.id, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;

create trigger salidas_caja_auditar after insert or update on public.salidas_caja
  for each row execute function public.auditar_salidas();

alter table public.salidas_caja enable row level security;

-- Igual que las ventas: el cajero ve las del día abierto; el admin, todas.
create policy salidas_ver_cajero on public.salidas_caja for select to authenticated
  using (
    public.usuario_activo()
    and exists (select 1 from public.jornadas j where j.id = jornada_id and j.estado = 'abierta')
  );
create policy salidas_ver_admin on public.salidas_caja for select to authenticated
  using (public.es_admin());

revoke all on public.salidas_caja from anon;

-- -----------------------------------------------------------------------------
-- El egreso que nace de una salida se maneja desde la caja.
-- -----------------------------------------------------------------------------
alter table public.egresos
  add column salida_caja_id uuid unique references public.salidas_caja (id) on delete restrict;

create or replace function public.proteger_egresos()
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
  if old.salida_caja_id is not null
    and coalesce(current_setting('avicola.desde_caja', true), '') <> 'si' then
    raise exception 'Este gasto se pagó con la plata de la caja: anulá la salida desde la caja de ese día.'
      using errcode = 'P0001';
  end if;
  new.salida_caja_id := old.salida_caja_id;
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

-- -----------------------------------------------------------------------------
-- Sacar efectivo (en el día abierto de hoy)
-- -----------------------------------------------------------------------------
create function public.registrar_salida(
  p_importe numeric, p_motivo public.motivo_salida, p_detalle text default null
)
returns public.salidas_caja
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jornada public.jornadas;
  v_salida public.salidas_caja;
  v_detalle text := nullif(trim(p_detalle), '');
  v_categoria uuid;
begin
  perform public.exigir_usuario_activo();

  if p_importe is null or p_importe <= 0 then
    raise exception 'El importe tiene que ser mayor a $ 0.' using errcode = 'P0001';
  end if;
  if p_importe > 9999999 then
    raise exception 'El importe es demasiado grande. Revisá los ceros.' using errcode = 'P0001';
  end if;
  if p_motivo is null then
    raise exception 'Elegí para qué sacaste la plata.' using errcode = 'P0001';
  end if;
  if p_motivo = 'otro' and v_detalle is null then
    raise exception 'Contá en pocas palabras para qué fue la plata.' using errcode = 'P0001';
  end if;
  if length(v_detalle) > 120 then
    raise exception 'El detalle es muy largo (máximo 120 letras).' using errcode = 'P0001';
  end if;

  select * into v_jornada from public.jornadas where estado = 'abierta';
  if not found then
    raise exception 'No hay un día abierto. Abrí el día para sacar plata de la caja.' using errcode = 'P0001';
  end if;
  if v_jornada.fecha <> public.hoy_ar() then
    raise exception 'Quedó abierto el día %. Cerralo y abrí el de hoy para seguir.',
      to_char(v_jornada.fecha, 'DD/MM') using errcode = 'P0001';
  end if;

  insert into public.salidas_caja (jornada_id, importe, motivo, detalle, registrada_por)
  values (v_jornada.id, round(p_importe, 2), p_motivo, v_detalle, auth.uid())
  returning * into v_salida;

  -- Pago a proveedor o gasto del local: también es un egreso del negocio.
  -- El retiro del dueño y "otro" no son gastos: solo salen de la caja.
  if p_motivo in ('proveedor', 'gasto') then
    select id into v_categoria from public.categorias_egreso
    where activa and lower(nombre) = case when p_motivo = 'proveedor' then 'mercadería' else 'otros' end;
    if v_categoria is null then
      select id into v_categoria from public.categorias_egreso
      where activa order by (lower(nombre) = 'otros') desc, nombre limit 1;
    end if;
    if v_categoria is null then
      raise exception 'No hay categorías de egreso activas. Pedile a un administrador que cree una.'
        using errcode = 'P0001';
    end if;

    insert into public.egresos
      (fecha, categoria_id, descripcion, proveedor, monto, medio_pago, registrado_por, salida_caja_id)
    values (
      v_jornada.fecha,
      v_categoria,
      coalesce(v_detalle, case when p_motivo = 'proveedor' then 'Pago a proveedor' else 'Gasto del local' end)
        || ' (desde la caja)',
      case when p_motivo = 'proveedor' then v_detalle end,
      v_salida.importe,
      'efectivo',
      auth.uid(),
      v_salida.id
    );
  end if;

  return v_salida;
end;
$$;

-- Mismas reglas que anular una venta.
create function public.anular_salida(p_salida_id uuid, p_motivo text)
returns public.salidas_caja
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_salida public.salidas_caja;
  v_estado public.estado_jornada;
begin
  perform public.exigir_usuario_activo();

  if p_motivo is null or length(trim(p_motivo)) < 3 then
    raise exception 'Escribí el motivo de la anulación (al menos 3 letras).' using errcode = 'P0001';
  end if;

  select * into v_salida from public.salidas_caja where id = p_salida_id for update;
  if not found then
    raise exception 'No encontramos esa salida.' using errcode = 'P0002';
  end if;

  select estado into v_estado from public.jornadas where id = v_salida.jornada_id;
  if v_estado = 'cerrada' then
    raise exception 'El día está cerrado: no se pueden anular salidas. Un administrador puede reabrirlo.'
      using errcode = 'P0001';
  end if;
  if v_salida.anulada then
    raise exception 'Esta salida ya estaba anulada.' using errcode = 'P0001';
  end if;

  if not public.es_admin() then
    if v_salida.registrada_por <> auth.uid() then
      raise exception 'Solo un administrador puede anular salidas cargadas por otra cuenta.'
        using errcode = '42501';
    end if;
    if v_salida.registrada_en < now() - interval '10 minutes' then
      raise exception 'Pasaron más de 10 minutos: solo un administrador puede anular esta salida.'
        using errcode = '42501';
    end if;
  end if;

  update public.salidas_caja
  set anulada = true, anulada_por = auth.uid(), anulada_en = now(),
      motivo_anulacion = trim(p_motivo)
  where id = p_salida_id
  returning * into v_salida;

  perform set_config('avicola.desde_caja', 'si', true);
  update public.egresos
  set anulado = true, motivo_anulacion = trim(p_motivo)
  where salida_caja_id = p_salida_id and not anulado;
  perform set_config('avicola.desde_caja', '', true);

  return v_salida;
end;
$$;

-- -----------------------------------------------------------------------------
-- Regla 7: efectivo esperado = fondo + ventas en efectivo − salidas.
-- -----------------------------------------------------------------------------
create function public.efectivo_esperado(p_jornada_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select j.fondo_inicial
    + coalesce((select sum(importe) from public.ventas
                where jornada_id = j.id and not anulada and medio_pago = 'efectivo'), 0)
    - coalesce((select sum(importe) from public.salidas_caja
                where jornada_id = j.id and not anulada), 0)
  from public.jornadas j
  where j.id = p_jornada_id;
$$;

revoke execute on function public.efectivo_esperado(uuid) from public, anon, authenticated;

drop function public.resumen_jornada(uuid);
create function public.resumen_jornada(p_jornada_id uuid)
returns table (
  jornada_id uuid,
  fecha date,
  estado public.estado_jornada,
  total numeric,
  total_efectivo numeric,
  total_digital numeric,
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

create or replace function public.cerrar_jornada(
  p_jornada_id uuid, p_efectivo_contado numeric, p_nota text default null
)
returns public.jornadas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jornada public.jornadas;
begin
  perform public.exigir_usuario_activo();

  if p_efectivo_contado is null or p_efectivo_contado < 0 then
    raise exception 'Escribí cuánto efectivo contaste (puede ser $ 0).' using errcode = 'P0001';
  end if;
  if p_nota is not null and length(p_nota) > 500 then
    raise exception 'La nota es muy larga (máximo 500 letras).' using errcode = 'P0001';
  end if;

  select * into v_jornada from public.jornadas where id = p_jornada_id for update;
  if not found then
    raise exception 'No encontramos ese día.' using errcode = 'P0002';
  end if;
  if v_jornada.estado = 'cerrada' then
    raise exception 'Este día ya está cerrado.' using errcode = 'P0001';
  end if;

  update public.jornadas
  set estado = 'cerrada',
      cerrada_por = auth.uid(),
      cerrada_en = now(),
      efectivo_contado = round(p_efectivo_contado, 2),
      diferencia_efectivo = round(p_efectivo_contado, 2) - public.efectivo_esperado(p_jornada_id),
      nota_cierre = nullif(trim(p_nota), '')
  where id = p_jornada_id
  returning * into v_jornada;

  return v_jornada;
end;
$$;

revoke execute on function
  public.proteger_salidas(),
  public.auditar_salidas()
from public, anon, authenticated;

revoke execute on function
  public.registrar_salida(numeric, public.motivo_salida, text),
  public.anular_salida(uuid, text)
from public, anon;
grant execute on function
  public.registrar_salida(numeric, public.motivo_salida, text),
  public.anular_salida(uuid, text)
to authenticated;
