-- =============================================================================
-- Avícola GD — El día se abre y se cierra solo
-- En el local no se abre ni se cierra la caja a mano: la primera venta del día
-- abre el día, y cualquier día anterior que haya quedado abierto se cierra solo
-- (sin arqueo: efectivo contado = esperado, diferencia 0).
-- =============================================================================

create function public.jornada_de_hoy()
returns public.jornadas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hoy date := public.hoy_ar();
  v_jornada public.jornadas;
begin
  -- Días anteriores que quedaron abiertos: se cierran solos.
  update public.jornadas j
  set estado = 'cerrada',
      cerrada_por = coalesce(auth.uid(), j.abierta_por),
      cerrada_en = now(),
      efectivo_contado = greatest(public.efectivo_esperado(j.id), 0),
      diferencia_efectivo = greatest(public.efectivo_esperado(j.id), 0) - public.efectivo_esperado(j.id),
      nota_cierre = 'Cierre automático'
  where j.estado = 'abierta' and j.fecha <> v_hoy;

  select * into v_jornada from public.jornadas where fecha = v_hoy for update;
  if not found then
    insert into public.jornadas (fecha, fondo_inicial, abierta_por)
    values (v_hoy, 0, auth.uid())
    returning * into v_jornada;
  elsif v_jornada.estado = 'cerrada' then
    update public.jornadas
    set estado = 'abierta', cerrada_por = null, cerrada_en = null,
        efectivo_contado = null, diferencia_efectivo = null, nota_cierre = null
    where id = v_jornada.id
    returning * into v_jornada;
  end if;
  return v_jornada;
end;
$$;

revoke execute on function public.jornada_de_hoy() from public, anon, authenticated;

create or replace function public.registrar_venta(p_importe numeric, p_medio_pago public.medio_pago)
returns public.ventas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jornada public.jornadas;
  v_venta public.ventas;
begin
  perform public.exigir_usuario_activo();

  if p_importe is null or p_importe <= 0 then
    raise exception 'El importe tiene que ser mayor a $ 0.' using errcode = 'P0001';
  end if;
  if p_importe > 9999999 then
    raise exception 'El importe es demasiado grande. Revisá los ceros.' using errcode = 'P0001';
  end if;
  if p_medio_pago is null then
    raise exception 'Elegí si la venta fue en efectivo o digital.' using errcode = 'P0001';
  end if;

  v_jornada := public.jornada_de_hoy();

  insert into public.ventas (jornada_id, importe, medio_pago, registrada_por)
  values (v_jornada.id, round(p_importe, 2), p_medio_pago, auth.uid())
  returning * into v_venta;

  return v_venta;
end;
$$;
