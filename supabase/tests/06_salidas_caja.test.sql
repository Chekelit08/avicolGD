-- Salidas de efectivo: se restan del esperado y las de proveedor quedan como egreso.
begin;
select plan(17);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_ok(
  $$select public.registrar_salida(5000, 'proveedor', 'Pollos Don Juan')$$,
  'P0001', 'No hay un día abierto. Abrí el día para sacar plata de la caja.',
  'sin día abierto no se saca plata'
);

select public.abrir_jornada(10000);
select public.registrar_venta(30000, 'efectivo');
select public.registrar_venta(20000, 'digital');

select lives_ok($$select public.registrar_salida(8000, 'proveedor', 'Pollos Don Juan')$$, 'el cajero paga al proveedor');
select lives_ok($$select public.registrar_salida(5000, 'retiro')$$, 'el cajero registra un retiro del dueño');
select throws_ok($$select public.registrar_salida(0, 'retiro')$$, 'P0001', 'El importe tiene que ser mayor a $ 0.', 'importe 0 rechazado');
select throws_ok($$select public.registrar_salida(100, 'otro', '  ')$$, 'P0001', 'Contá en pocas palabras para qué fue la plata.', '"otro" pide detalle');
select throws_ok($$select public.registrar_salida(100, null)$$, 'P0001', 'Elegí para qué sacaste la plata.', 'el motivo es obligatorio');

select results_eq(
  $$select total_salidas, cantidad_salidas, efectivo_esperado
    from public.resumen_jornada((select id from public.jornadas where estado = 'abierta'))$$,
  $$values (13000.00::numeric, 2::bigint, 27000.00::numeric)$$,
  'esperado = fondo + efectivo − salidas'
);
select is(
  (select count(*)::int from public.salidas_caja), 2,
  'el cajero ve las salidas del día abierto'
);
select is_empty('select * from public.egresos', 'el cajero sigue sin ver egresos');

delete from public.salidas_caja;
select is(
  (select count(*)::int from public.salidas_caja), 2, 'el cajero no borra salidas directo'
);

-- Anular el pago al proveedor también anula su egreso.
select lives_ok(
  $$select public.anular_salida((select id from public.salidas_caja where motivo = 'proveedor'), 'Me equivoqué')$$,
  'el cajero anula su salida reciente'
);

reset role;
select results_eq(
  $$select count(*)::int, bool_and(anulado) from public.egresos where salida_caja_id is not null$$,
  $$values (1, true)$$,
  'el egreso de la salida se anuló con ella'
);

-- El admin no puede tocar ese egreso desde Egresos.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select public.registrar_salida(2500, 'gasto', 'Lavandina');
select is(
  (select c.nombre from public.egresos e join public.categorias_egreso c on c.id = e.categoria_id
   where e.descripcion = 'Lavandina (desde la caja)'),
  'Otros', 'un gasto del local queda como egreso en "Otros"'
);
select throws_ok(
  $$update public.egresos set monto = 1 where descripcion = 'Lavandina (desde la caja)'$$,
  'P0001', 'Este gasto se pagó con la plata de la caja: anulá la salida desde la caja de ese día.',
  'el egreso de una salida no se edita desde Egresos'
);

-- Cerrar: la diferencia descuenta las salidas.
select public.cerrar_jornada((select id from public.jornadas where estado = 'abierta'), 32500);
select is(
  (select diferencia_efectivo from public.jornadas where fecha = public.hoy_ar()),
  0.00::numeric, 'contado 32.500 = 10.000 + 30.000 − 5.000 − 2.500 (la anulada no cuenta)'
);
select throws_ok(
  $$select public.anular_salida((select id from public.salidas_caja where motivo = 'retiro'), 'tarde')$$,
  'P0001', null, 'con el día cerrado no se anulan salidas'
);
select is(
  (select count(*)::int from public.auditoria where accion in ('sacar_efectivo', 'anular_salida')), 4,
  'la auditoría registra las salidas y la anulación'
);

select * from finish();
rollback;
