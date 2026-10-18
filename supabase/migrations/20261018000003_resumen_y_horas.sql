-- =============================================================================
-- Avícola GD — WhatsApp del dueño, horas pico y "hoy contra la semana pasada"
-- =============================================================================

-- Número al que se manda el resumen del cierre (solo dígitos, con código de país: 5491122334455).
alter table public.configuracion
  add column whatsapp_dueno text check (whatsapp_dueno ~ '^[0-9]{8,15}$');

-- Ventas por hora del día: promedio por día trabajado (solo admin).
create function public.ventas_por_hora(p_desde date, p_hasta date)
returns table (
  hora int,
  dias_trabajados bigint,
  promedio_total numeric,
  promedio_cantidad numeric
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_dias bigint;
begin
  perform public.exigir_admin();
  if p_hasta < p_desde then
    raise exception 'La fecha "hasta" no puede ser anterior a "desde".' using errcode = 'P0001';
  end if;

  select count(*) into v_dias from public.jornadas where fecha between p_desde and p_hasta;

  return query
  select h.hora,
         v_dias,
         case when v_dias > 0 then round(coalesce(sum(v.importe), 0) / v_dias, 2) else 0 end,
         case when v_dias > 0 then round(count(v.id)::numeric / v_dias, 1) else 0 end
  from generate_series(0, 23) as h(hora)
  left join (
    select v.id, v.importe,
           extract(hour from v.registrada_en at time zone 'America/Argentina/Buenos_Aires')::int as hora
    from public.ventas v
    join public.jornadas j on j.id = v.jornada_id
    where j.fecha between p_desde and p_hasta and not v.anulada
  ) v on v.hora = h.hora
  group by h.hora
  order by h.hora;
end;
$$;

-- Hoy contra el mismo día de la semana pasada, hasta la misma hora (comparación justa).
create function public.hoy_contra_semana_pasada()
returns table (
  hoy numeric,
  semana_pasada_a_esta_hora numeric,
  semana_pasada_total numeric,
  hubo_caja_semana_pasada boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_hoy date := public.hoy_ar();
  v_hora time := (now() at time zone 'America/Argentina/Buenos_Aires')::time;
begin
  perform public.exigir_admin();

  return query
  select
    coalesce((select sum(v.importe) from public.ventas v join public.jornadas j on j.id = v.jornada_id
              where j.fecha = v_hoy and not v.anulada), 0),
    coalesce((select sum(v.importe) from public.ventas v join public.jornadas j on j.id = v.jornada_id
              where j.fecha = v_hoy - 7 and not v.anulada
                and (v.registrada_en at time zone 'America/Argentina/Buenos_Aires')::time <= v_hora), 0),
    coalesce((select sum(v.importe) from public.ventas v join public.jornadas j on j.id = v.jornada_id
              where j.fecha = v_hoy - 7 and not v.anulada), 0),
    exists (select 1 from public.jornadas where fecha = v_hoy - 7);
end;
$$;

revoke execute on function
  public.ventas_por_hora(date, date),
  public.hoy_contra_semana_pasada()
from public, anon;
grant execute on function
  public.ventas_por_hora(date, date),
  public.hoy_contra_semana_pasada()
to authenticated;
