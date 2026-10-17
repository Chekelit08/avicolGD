-- Flujo del día y reglas de negocio de la caja.
begin;
select plan(26);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';

-- Abrir el día
select lives_ok($$select public.abrir_jornada(10000)$$, 'el cajero abre el día con fondo de caja');
select is((select count(*)::int from public.jornadas where estado = 'abierta'), 1, 'hay una sola jornada abierta');
select throws_ok($$select public.abrir_jornada(0)$$, 'P0001', 'El día de hoy ya está abierto.', 'no se abre dos veces');
select throws_ok($$select public.abrir_jornada(-5)$$, 'P0001', null, 'el fondo no puede ser negativo');

-- Cargar ventas
select lives_ok($$select public.registrar_venta(12500, 'efectivo')$$, 'carga venta en efectivo');
select lives_ok($$select public.registrar_venta(8300, 'digital')$$, 'carga venta digital');
select lives_ok($$select public.registrar_venta(4000, 'efectivo')$$, 'carga otra venta en efectivo');
select throws_ok($$select public.registrar_venta(0, 'efectivo')$$, 'P0001', 'El importe tiene que ser mayor a $ 0.', 'importe 0 rechazado');
select throws_ok($$select public.registrar_venta(-100, 'efectivo')$$, 'P0001', null, 'importe negativo rechazado');
select throws_ok($$select public.registrar_venta(10000000, 'efectivo')$$, 'P0001', null, 'importe gigante rechazado');
select throws_ok($$select public.registrar_venta(100, null)$$, 'P0001', 'Elegí si la venta fue en efectivo o digital.', 'el tipo es obligatorio');
select is(
  (select registrada_por from public.ventas where importe = 12500 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar())),
  'a0000000-0000-4000-8000-000000000003'::uuid,
  'la venta guarda quién la cargó'
);

-- Anular: propia y reciente sí
select lives_ok(
  $$select public.anular_venta((select id from public.ventas where importe = 4000 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar())), 'Error de tipeo')$$,
  'el cajero anula su venta reciente'
);
select throws_ok(
  $$select public.anular_venta((select id from public.ventas where importe = 8300 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar())), '')$$,
  'P0001', null, 'anular exige motivo'
);
select throws_ok(
  $$select public.anular_venta((select id from public.ventas where importe = 4000 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar())), 'otra vez')$$,
  'P0001', 'Esta venta ya estaba anulada.', 'no se anula dos veces'
);

-- Anular: de hace más de 10 minutos no
reset role;
set local session_replication_role = replica;
update public.ventas set registrada_en = now() - interval '11 minutes' where importe = 8300 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar());
set local session_replication_role = origin;
set local role authenticated;
select throws_ok(
  $$select public.anular_venta((select id from public.ventas where importe = 8300 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar())), 'Me equivoqué')$$,
  '42501', 'Pasaron más de 10 minutos: solo un administrador puede anular esta venta.',
  'el cajero no anula ventas viejas'
);

-- Resumen: excluye anuladas y calcula el efectivo esperado
select results_eq(
  $$select total, total_efectivo, total_digital, cantidad_ventas, cantidad_anuladas, efectivo_esperado
    from public.resumen_jornada((select id from public.jornadas where estado = 'abierta'))$$,
  $$values (20800.00::numeric, 12500.00::numeric, 8300.00::numeric, 2::bigint, 1::bigint, 22500.00::numeric)$$,
  'el resumen excluye anuladas y suma fondo + efectivo'
);

-- Las ventas no se editan ni se borran, ni siquiera desde la base
reset role;
select throws_ok(
  $$update public.ventas set importe = 1 where importe = 12500 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar())$$,
  'P0001', 'Una venta no se edita: anulala y cargala de nuevo.', 'una venta no se edita'
);
select throws_ok(
  $$delete from public.ventas where importe = 12500 and jornada_id = (select id from public.jornadas where fecha = public.hoy_ar())$$,
  'P0001', 'Las ventas no se borran: se anulan con un motivo.', 'una venta no se borra'
);
set local role authenticated;

-- Cerrar el día
select lives_ok(
  $$select public.cerrar_jornada((select id from public.jornadas where estado = 'abierta'), 22000, 'Faltan 500')$$,
  'el cajero cierra el día'
);
select is(
  (select diferencia_efectivo from public.jornadas where fecha = public.hoy_ar()),
  -500.00::numeric, 'la diferencia es contado − esperado'
);
select is(
  (select total from public.resumen_jornada((select id from public.jornadas where fecha = public.hoy_ar()))),
  20800.00::numeric, 'el cajero ve el resumen del día de hoy ya cerrado'
);
select throws_ok($$select public.registrar_venta(100, 'efectivo')$$, 'P0001', 'No hay un día abierto. Abrí el día para cargar ventas.', 'no se carga en un día cerrado');
select throws_ok($$select public.abrir_jornada(0)$$, 'P0001', null, 'no se vuelve a abrir el día cerrado');
select throws_ok(
  $$select public.reabrir_jornada((select id from public.jornadas where fecha = public.hoy_ar()))$$,
  '42501', 'Esta acción es solo para administradores.', 'el cajero no reabre días'
);
reset role;
select throws_ok(
  $$insert into public.ventas (jornada_id, importe, medio_pago, registrada_por)
    values ((select id from public.jornadas where fecha = public.hoy_ar()), 100, 'efectivo',
            'a0000000-0000-4000-8000-000000000003')$$,
  'P0001', null, 'ni desde la base se cargan ventas en un día cerrado'
);

select * from finish();
rollback;
