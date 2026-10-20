-- =============================================================================
-- Avícola GD — Vaciar las cargas de prueba de la base real (una sola vez)
-- Pegalo entero en Supabase → SQL Editor y apretá Run.
--
-- Borra: días, ventas, salidas de caja, egresos, cobros de Mercado Pago,
--        empleados/pagos, la auditoría y las cuentas de prueba (prueba-claude…).
-- Deja:  tu usuario (y cualquier otra cuenta real), la configuración y las categorías.
--
-- Es una sola transacción: si algo falla, no se borra nada y las protecciones
-- quedan como estaban.
-- =============================================================================
begin;

alter table public.ventas disable trigger ventas_proteger;
alter table public.salidas_caja disable trigger salidas_caja_proteger;
alter table public.egresos disable trigger egresos_proteger;
alter table public.auditoria disable trigger auditoria_sin_cambios;
alter table public.pagos_empleados disable trigger pagos_empleados_auditar;

delete from public.cobros_mp;
delete from public.egresos;
delete from public.salidas_caja;
delete from public.ventas;
delete from public.jornadas;
delete from public.pagos_empleados;
delete from public.empleados;
delete from public.auditoria;

-- Cuentas de prueba que creó Claude para revisar que Usuarios funcione.
delete from public.perfiles
where email in ('prueba-claude@avicola.test', 'prueba-claude-2@avicola.test');
delete from auth.identities
where user_id in (select id from auth.users
                  where email in ('prueba-claude@avicola.test', 'prueba-claude-2@avicola.test'));
delete from auth.users
where email in ('prueba-claude@avicola.test', 'prueba-claude-2@avicola.test');

alter table public.ventas enable trigger ventas_proteger;
alter table public.salidas_caja enable trigger salidas_caja_proteger;
alter table public.egresos enable trigger egresos_proteger;
alter table public.auditoria enable trigger auditoria_sin_cambios;
alter table public.pagos_empleados enable trigger pagos_empleados_auditar;

commit;

-- Para revisar: todo en 0 menos usuarios (tus cuentas reales), configuración (1) y categorías (6).
select
  (select count(*) from public.jornadas) as dias,
  (select count(*) from public.ventas) as ventas,
  (select count(*) from public.salidas_caja) as salidas,
  (select count(*) from public.egresos) as egresos,
  (select count(*) from public.cobros_mp) as cobros_mp,
  (select count(*) from public.auditoria) as auditoria,
  (select count(*) from public.perfiles) as usuarios,
  (select count(*) from public.configuracion) as configuracion,
  (select count(*) from public.categorias_egreso) as categorias;
