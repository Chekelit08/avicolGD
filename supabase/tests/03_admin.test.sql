-- Lo que puede hacer un admin, y que quede en la auditoría.
begin;
select plan(16);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select isnt_empty('select * from public.egresos', 'el admin ve egresos');
select isnt_empty('select * from public.pagos_empleados', 'el admin ve sueldos');
select isnt_empty('select * from public.jornadas where fecha < public.hoy_ar()', 'el admin ve días anteriores');
select isnt_empty('select * from public.facturacion_por_dia(public.hoy_ar() - 30, public.hoy_ar())', 'el admin ve la facturación diaria');
select ok((select total > 0 from public.resumen_periodo(public.hoy_ar() - 30, public.hoy_ar())), 'el resumen del período tiene ventas');

-- Reabrir un día queda en auditoría con nombre
select lives_ok(
  $$select public.reabrir_jornada((select id from public.jornadas where fecha = public.hoy_ar() - 1 or fecha = public.hoy_ar() - 2 order by fecha desc limit 1))$$,
  'el admin reabre un día cerrado'
);
select is(
  (select usuario_nombre || ':' || accion from public.auditoria order by created_at desc limit 1),
  'Gabriel:reabrir_jornada', 'la reapertura queda registrada con nombre'
);
select throws_ok(
  $$select public.reabrir_jornada((select id from public.jornadas where estado = 'cerrada' limit 1))$$,
  'P0001', null, 'no se reabre otro día mientras hay uno abierto'
);

-- El admin anula una venta vieja del día reabierto
select lives_ok(
  $$select public.anular_venta(
      (select v.id from public.ventas v join public.jornadas j on j.id = v.jornada_id
       where j.estado = 'abierta' and not v.anulada limit 1), 'Cargada dos veces')$$,
  'el admin anula una venta de más de 10 minutos'
);
select ok(
  exists (select 1 from public.auditoria where accion = 'anular_venta' and usuario_nombre = 'Gabriel'),
  'la anulación queda en la auditoría'
);

-- Un día que quedó abierto de ayer bloquea abrir hoy
select throws_ok($$select public.abrir_jornada(0)$$, 'P0001', null, 'con un día viejo abierto no se abre otro');
select throws_ok($$select public.registrar_venta(100, 'efectivo')$$, 'P0001', null, 'ni se cargan ventas de hoy en el día viejo');

-- El admin cambia nombre y rol, pero no el email ni la marca de clave temporal
update public.perfiles set email = 'otro@x.com', debe_cambiar_clave = true, nombre = 'Caja 1'
where id = 'a0000000-0000-4000-8000-000000000003';
select is(
  (select email || '|' || debe_cambiar_clave::text || '|' || nombre from public.perfiles where id = 'a0000000-0000-4000-8000-000000000003'),
  'mostrador@avicola.test|false|Caja 1', 'el admin no cambia email ni clave temporal desde la app'
);
select throws_ok(
  $$select public.registrar_auditoria_servicio(auth.uid(), 'x', null, null)$$,
  '42501', null, 'la auditoría de servicio no se puede llamar desde la app'
);

-- No se puede quedar sin admins
update public.perfiles set activo = false where id = 'a0000000-0000-4000-8000-000000000002';
select throws_ok(
  $$update public.perfiles set rol = 'cajero' where id = 'a0000000-0000-4000-8000-000000000001'$$,
  'P0001', 'Tiene que quedar al menos un administrador activo.', 'siempre queda un admin activo'
);
select is(
  (select accion from public.auditoria where registro_id = 'a0000000-0000-4000-8000-000000000002' order by created_at desc limit 1),
  'desactivar_usuario', 'desactivar un usuario queda en la auditoría'
);

select * from finish();
rollback;
