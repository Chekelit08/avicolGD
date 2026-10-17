-- =============================================================================
-- Avícola GD — Fase 2: reportes (solo admin)
-- Los totales los calcula la base. Excluyen las ventas anuladas.
-- =============================================================================

-- Resumen de un período cualquiera (semana, mes, rango).
create function public.resumen_periodo(p_desde date, p_hasta date)
returns table (
  desde date,
  hasta date,
  total numeric,
  total_efectivo numeric,
  total_digital numeric,
  cantidad_ventas bigint,
  ticket_promedio numeric,
  dias_trabajados bigint,
  promedio_diario numeric,
  diferencia_caja numeric,
  mejor_dia date,
  mejor_dia_total numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.exigir_admin();
  if p_hasta < p_desde then
    raise exception 'La fecha "hasta" no puede ser anterior a "desde".' using errcode = 'P0001';
  end if;

  return query
  with por_dia as (
    select j.fecha,
           j.diferencia_efectivo,
           coalesce(sum(v.importe) filter (where not v.anulada), 0) as total,
           coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'efectivo'), 0) as efectivo,
           coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'digital'), 0) as digital,
           count(v.id) filter (where not v.anulada) as cantidad
    from public.jornadas j
    left join public.ventas v on v.jornada_id = j.id
    where j.fecha between p_desde and p_hasta
    group by j.id
  ),
  mejor as (
    select fecha, total from por_dia where total > 0 order by total desc, fecha limit 1
  )
  select
    p_desde,
    p_hasta,
    coalesce(sum(d.total), 0),
    coalesce(sum(d.efectivo), 0),
    coalesce(sum(d.digital), 0),
    coalesce(sum(d.cantidad), 0)::bigint,
    case when coalesce(sum(d.cantidad), 0) > 0 then round(sum(d.total) / sum(d.cantidad), 2) else 0 end,
    count(d.fecha),
    case when count(d.fecha) > 0 then round(sum(d.total) / count(d.fecha), 2) else 0 end,
    coalesce(sum(d.diferencia_efectivo), 0),
    (select fecha from mejor),
    (select total from mejor)
  from por_dia d;
end;
$$;

-- Facturación día por día, con los días sin jornada (local cerrado) marcados.
create function public.facturacion_por_dia(p_desde date, p_hasta date)
returns table (
  fecha date,
  trabajado boolean,
  total numeric,
  total_efectivo numeric,
  total_digital numeric,
  cantidad_ventas bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.exigir_admin();
  if p_hasta - p_desde > 400 then
    raise exception 'Elegí un rango de hasta 400 días.' using errcode = 'P0001';
  end if;

  return query
  select
    dia::date,
    j.id is not null,
    coalesce(sum(v.importe) filter (where not v.anulada), 0),
    coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'efectivo'), 0),
    coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'digital'), 0),
    count(v.id) filter (where not v.anulada)
  from generate_series(p_desde, p_hasta, interval '1 day') as dia
  left join public.jornadas j on j.fecha = dia::date
  left join public.ventas v on v.jornada_id = j.id
  group by dia, j.id
  order by dia;
end;
$$;

-- Facturación agrupada por semana (lunes a domingo) o por mes.
create function public.facturacion_agrupada(p_desde date, p_hasta date, p_unidad text)
returns table (
  periodo date,
  total numeric,
  total_efectivo numeric,
  total_digital numeric,
  cantidad_ventas bigint,
  dias_trabajados bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.exigir_admin();
  if p_unidad not in ('week', 'month') then
    raise exception 'Unidad inválida: usá week o month.' using errcode = 'P0001';
  end if;

  return query
  with por_dia as (
    select j.fecha,
           coalesce(sum(v.importe) filter (where not v.anulada), 0) as total,
           coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'efectivo'), 0) as efectivo,
           coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'digital'), 0) as digital,
           count(v.id) filter (where not v.anulada) as cantidad
    from public.jornadas j
    left join public.ventas v on v.jornada_id = j.id
    where j.fecha between p_desde and p_hasta
    group by j.id
  )
  select date_trunc(p_unidad, d.fecha)::date as p,
         sum(d.total), sum(d.efectivo), sum(d.digital), sum(d.cantidad)::bigint, count(*)
  from por_dia d
  group by p
  order by p;
end;
$$;

-- Qué días de la semana se vende más (1 = lunes … 7 = domingo).
create function public.ventas_por_dia_semana(p_desde date, p_hasta date)
returns table (
  dia_semana int,
  dias_trabajados bigint,
  total numeric,
  promedio numeric
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
  with por_dia as (
    select j.fecha, coalesce(sum(v.importe) filter (where not v.anulada), 0) as total
    from public.jornadas j
    left join public.ventas v on v.jornada_id = j.id
    where j.fecha between p_desde and p_hasta
    group by j.id
  )
  select extract(isodow from d.fecha)::int as dia,
         count(*), sum(d.total), round(avg(d.total), 2)
  from por_dia d
  group by dia
  order by dia;
end;
$$;

grant execute on function
  public.resumen_periodo(date, date),
  public.facturacion_por_dia(date, date),
  public.facturacion_agrupada(date, date, text),
  public.ventas_por_dia_semana(date, date)
to authenticated;
