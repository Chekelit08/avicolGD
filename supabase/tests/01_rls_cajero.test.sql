-- Un cajero (cuenta Mostrador) NO puede ver egresos, sueldos, empleados, auditoría ni historial.
begin;
select plan(16);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select is_empty('select * from public.egresos', 'el cajero no ve egresos');
select is_empty('select * from public.pagos_empleados', 'el cajero no ve sueldos ni adelantos');
select is_empty('select * from public.empleados', 'el cajero no ve empleados');
select is_empty('select * from public.categorias_egreso', 'el cajero no ve categorías de egreso');
select is_empty('select * from public.auditoria', 'el cajero no ve la auditoría');
select is_empty('select * from public.jornadas', 'el cajero no ve días anteriores cerrados');
select is_empty('select * from public.ventas', 'el cajero no ve ventas de días cerrados');
select is_empty(
  $$select * from public.perfiles where id <> 'a0000000-0000-4000-8000-000000000003'$$,
  'el cajero no ve otros usuarios'
);

select throws_ok(
  $$insert into public.egresos (fecha, categoria_id, descripcion, monto, medio_pago)
    values (current_date, (select id from public.categorias_egreso limit 1), 'x', 100, 'efectivo')$$,
  '42501', null, 'el cajero no puede cargar egresos'
);
select throws_ok(
  $$insert into public.ventas (jornada_id, importe, medio_pago, registrada_por)
    values (gen_random_uuid(), 100, 'efectivo', auth.uid())$$,
  '42501', null, 'el cajero no inserta ventas directo: tiene que usar registrar_venta'
);
select throws_ok(
  $$select * from public.resumen_periodo(current_date - 30, current_date)$$,
  '42501', 'Esta acción es solo para administradores.', 'el cajero no ve resúmenes históricos'
);
select throws_ok(
  $$select * from public.ingresos_egresos_mensual(current_date - 90, current_date)$$,
  '42501', null, 'el cajero no ve ingresos vs egresos'
);
select throws_ok(
  $$select * from public.personal_del_mes(current_date)$$,
  '42501', null, 'el cajero no ve el costo de personal'
);

-- Intentar subirse de rol no tiene efecto (no hay política de update para él).
update public.perfiles set rol = 'admin' where id = auth.uid();
select is(
  (select rol::text from public.perfiles where id = auth.uid()), 'cajero',
  'el cajero no puede cambiarse el rol'
);

-- Anónimos: nada.
reset role;
set local role anon;
select throws_ok('select * from public.ventas', '42501', null, 'un anónimo no puede leer ventas');
select throws_ok(
  $$select public.registrar_venta(100, 'efectivo')$$, '42501', null,
  'un anónimo no puede cargar ventas'
);

select * from finish();
rollback;
