-- Egresos y pagos: solo admin, anulación con motivo y auditoría.
begin;
select plan(9);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

insert into public.egresos (fecha, categoria_id, descripcion, proveedor, monto, medio_pago)
values (public.hoy_ar(), (select id from public.categorias_egreso where nombre = 'Otros'), 'Bolsas', 'Papelera', 15000, 'efectivo');

select is(
  (select registrado_por from public.egresos where descripcion = 'Bolsas'),
  'a0000000-0000-4000-8000-000000000001'::uuid, 'el egreso guarda quién lo cargó'
);
select throws_ok(
  $$update public.egresos set anulado = true where descripcion = 'Bolsas'$$,
  '23514', null, 'anular un egreso exige motivo'
);
update public.egresos set anulado = true, motivo_anulacion = 'Duplicado' where descripcion = 'Bolsas';
select ok(exists (select 1 from public.auditoria where accion = 'anular_egreso'), 'anular egreso queda en auditoría');
select throws_ok(
  $$update public.egresos set monto = 1 where descripcion = 'Bolsas'$$,
  'P0001', null, 'un egreso anulado no se modifica'
);
delete from public.egresos where descripcion = 'Bolsas';
reset role;
select throws_ok(
  $$delete from public.egresos where descripcion = 'Bolsas'$$,
  'P0001', null, 'los egresos no se borran, ni desde la base'
);
set local role authenticated;

select ok(exists (select 1 from public.egresos where descripcion = 'Bolsas'), 'el admin tampoco puede borrar egresos');

delete from public.pagos_empleados where tipo = 'adelanto';
select ok(exists (select 1 from public.auditoria where accion = 'borrar_pago'), 'borrar un pago queda en auditoría');

select throws_ok(
  $$insert into public.pagos_empleados (empleado_id, fecha, tipo, periodo, monto, medio_pago)
    values ('e0000000-0000-4000-8000-000000000001', current_date, 'sueldo', '2026-10-15', 100, 'digital')$$,
  '23514', null, 'el período de un pago es siempre el día 1 del mes'
);
select ok(
  (select sum(ganancia) is not null from public.ingresos_egresos_mensual(public.hoy_ar() - 60, public.hoy_ar())),
  'calcula la ganancia aproximada por mes'
);

select * from finish();
rollback;
