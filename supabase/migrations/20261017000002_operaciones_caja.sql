-- =============================================================================
-- Avícola GD — Fase 1: operaciones de la caja
-- Todas las escrituras de jornadas y ventas pasan por estas funciones, que
-- validan las reglas de negocio. Los mensajes de error se muestran tal cual
-- en la app: están escritos para quien atiende el mostrador.
-- =============================================================================

create function public.exigir_usuario_activo()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.usuario_activo() then
    raise exception 'Tu usuario no está activo. Pedile a un administrador que lo revise.'
      using errcode = '42501';
  end if;
end;
$$;

create function public.exigir_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Esta acción es solo para administradores.' using errcode = '42501';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Abrir el día
-- -----------------------------------------------------------------------------
create function public.abrir_jornada(p_fondo_inicial numeric default 0)
returns public.jornadas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_abierta public.jornadas;
  v_hoy date := public.hoy_ar();
  v_nueva public.jornadas;
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

  return v_nueva;
end;
$$;

-- -----------------------------------------------------------------------------
-- Cargar una venta (en la jornada abierta de hoy)
-- -----------------------------------------------------------------------------
create function public.registrar_venta(p_importe numeric, p_medio_pago public.medio_pago)
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

  select * into v_jornada from public.jornadas where estado = 'abierta';
  if not found then
    raise exception 'No hay un día abierto. Abrí el día para cargar ventas.' using errcode = 'P0001';
  end if;
  if v_jornada.fecha <> public.hoy_ar() then
    raise exception 'Quedó abierto el día %. Cerralo y abrí el de hoy para seguir cargando.',
      to_char(v_jornada.fecha, 'DD/MM') using errcode = 'P0001';
  end if;

  insert into public.ventas (jornada_id, importe, medio_pago, registrada_por)
  values (v_jornada.id, round(p_importe, 2), p_medio_pago, auth.uid())
  returning * into v_venta;

  return v_venta;
end;
$$;

-- -----------------------------------------------------------------------------
-- Anular una venta
-- Regla 4: el admin anula cualquiera (con la jornada abierta). Un cajero solo
-- las que cargó su cuenta hace menos de 10 minutos.
-- -----------------------------------------------------------------------------
create function public.anular_venta(p_venta_id uuid, p_motivo text)
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
    if v_venta.registrada_por <> auth.uid() then
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
-- Resumen de una jornada (lo calcula la base)
-- security invoker: respeta el RLS, así un cajero solo resume la jornada abierta.
-- -----------------------------------------------------------------------------
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
  efectivo_esperado numeric,
  efectivo_contado numeric,
  diferencia_efectivo numeric
)
language sql
stable
security invoker
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
    j.fondo_inicial + coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'efectivo'), 0),
    j.efectivo_contado,
    j.diferencia_efectivo
  from public.jornadas j
  left join public.ventas v on v.jornada_id = j.id
  where j.id = p_jornada_id
  group by j.id;
$$;

-- -----------------------------------------------------------------------------
-- Cerrar el día con arqueo
-- -----------------------------------------------------------------------------
create function public.cerrar_jornada(
  p_jornada_id uuid, p_efectivo_contado numeric, p_nota text default null
)
returns public.jornadas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jornada public.jornadas;
  v_esperado numeric;
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

  select v_jornada.fondo_inicial + coalesce(sum(importe), 0) into v_esperado
  from public.ventas
  where jornada_id = p_jornada_id and not anulada and medio_pago = 'efectivo';

  update public.jornadas
  set estado = 'cerrada',
      cerrada_por = auth.uid(),
      cerrada_en = now(),
      efectivo_contado = round(p_efectivo_contado, 2),
      diferencia_efectivo = round(p_efectivo_contado, 2) - v_esperado,
      nota_cierre = nullif(trim(p_nota), '')
  where id = p_jornada_id
  returning * into v_jornada;

  return v_jornada;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reabrir un día cerrado (solo admin; queda en auditoría)
-- -----------------------------------------------------------------------------
create function public.reabrir_jornada(p_jornada_id uuid)
returns public.jornadas
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jornada public.jornadas;
  v_abierta date;
begin
  perform public.exigir_admin();

  select * into v_jornada from public.jornadas where id = p_jornada_id for update;
  if not found then
    raise exception 'No encontramos ese día.' using errcode = 'P0002';
  end if;
  if v_jornada.estado = 'abierta' then
    raise exception 'Este día ya está abierto.' using errcode = 'P0001';
  end if;

  select fecha into v_abierta from public.jornadas where estado = 'abierta';
  if found then
    raise exception 'Está abierto el día %. Cerralo antes de reabrir otro.',
      to_char(v_abierta, 'DD/MM') using errcode = 'P0001';
  end if;

  update public.jornadas
  set estado = 'abierta', cerrada_por = null, cerrada_en = null,
      efectivo_contado = null, diferencia_efectivo = null
  where id = p_jornada_id
  returning * into v_jornada;

  return v_jornada;
end;
$$;

-- -----------------------------------------------------------------------------
-- Contraseña cambiada (después del primer ingreso con clave temporal)
-- -----------------------------------------------------------------------------
create function public.marcar_clave_cambiada()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.perfiles set debe_cambiar_clave = false where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Permisos de ejecución: nada para anónimos.
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.abrir_jornada(numeric),
  public.registrar_venta(numeric, public.medio_pago),
  public.anular_venta(uuid, text),
  public.resumen_jornada(uuid),
  public.cerrar_jornada(uuid, numeric, text),
  public.reabrir_jornada(uuid),
  public.marcar_clave_cambiada(),
  public.usuario_activo(),
  public.es_admin(),
  public.hoy_ar()
to authenticated;

-- Las tablas y funciones que se creen después tampoco quedan abiertas a anónimos.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public, anon;
