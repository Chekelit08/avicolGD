-- Cobros de Mercado Pago: se cargan solos una sola vez y no duplican lo que tipeó el cajero.
begin;
select plan(17);

-- Solo la Edge Function (service_role) registra cobros.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$select public.registrar_cobro_mp('1', 100, now())$$, '42501', null,
  'ni un admin registra cobros de MP a mano'
);
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok(
  $$select public.registrar_cobro_mp('1', 100, now())$$, '42501', null, 'el cajero tampoco'
);
select is_empty('select * from public.cobros_mp', 'el cajero no ve los cobros de MP');

-- Con la caja cerrada, el cobro queda pendiente.
reset role;
set local role service_role;
select is(
  (public.registrar_cobro_mp('MP-1', 15000, now(), 'regular_payment', 'QR', 'Ana')).estado,
  'pendiente'::public.estado_cobro_mp, 'sin día abierto el cobro queda pendiente'
);

-- Al abrir el día entra solo.
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select public.abrir_jornada(0);
select results_eq(
  $$select importe, medio_pago::text, origen::text, registrada_por from public.ventas$$,
  $$values (15000.00::numeric, 'digital', 'mercadopago', null::uuid)$$,
  'al abrir el día, el cobro pendiente entra como venta digital de Mercado Pago'
);

-- Con el día abierto entra en el momento, y el mismo aviso dos veces no duplica.
reset role;
set local role service_role;
select is(
  (public.registrar_cobro_mp('MP-2', 8000, now())).estado,
  'cargado'::public.estado_cobro_mp, 'con el día abierto el cobro se carga al instante'
);
select lives_ok($$select public.registrar_cobro_mp('MP-2', 8000, now())$$, 'el aviso repetido no falla');
reset role;
select is((select count(*)::int from public.ventas where importe = 8000 and jornada_id = (select id from public.jornadas where estado = 'abierta')), 1, 'el aviso repetido no duplica la venta');

-- Si el cajero ya la tipeó con +, el cobro se asocia a esa venta.
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select public.registrar_venta(4200, 'digital');
reset role;
set local role service_role;
select public.registrar_cobro_mp('MP-3', 4200, now());
reset role;
select results_eq(
  $$select count(*)::int, bool_and(origen = 'manual') from public.ventas where importe = 4200
    and jornada_id = (select id from public.jornadas where estado = 'abierta')$$,
  $$values (1, true)$$,
  'si el cajero ya la cargó, no se carga de nuevo'
);
select is(
  (select v.importe from public.cobros_mp c join public.ventas v on v.id = c.venta_id where c.id_mp = 'MP-3'),
  4200.00::numeric, 'el cobro queda asociado a la venta que tipeó el cajero'
);

-- Un cobro de otro día queda pendiente para el admin.
set local role service_role;
select is(
  (public.registrar_cobro_mp('MP-4', 3000, now() - interval '2 days')).estado,
  'pendiente'::public.estado_cobro_mp, 'un cobro de un día anterior no entra solo'
);

-- El cajero no puede anular una venta de Mercado Pago.
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok(
  $$select public.anular_venta((select id from public.ventas where importe = 8000), 'No era para el local')$$,
  '42501', 'Solo un administrador puede anular ventas cargadas por otra cuenta.',
  'el cajero no anula ventas de Mercado Pago'
);
select throws_ok(
  $$select public.resolver_cobro_mp((select id from public.cobros_mp limit 1), true)$$,
  '42501', null, 'el cajero no resuelve cobros pendientes'
);

-- El admin resuelve los pendientes.
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$select public.resolver_cobro_mp((select id from public.cobros_mp where id_mp = 'MP-4'), false, '')$$,
  'P0001', 'Escribí por qué no se carga (al menos 3 letras).', 'descartar pide motivo'
);
select is(
  (public.resolver_cobro_mp((select id from public.cobros_mp where id_mp = 'MP-4'), true)).estado,
  'cargado'::public.estado_cobro_mp, 'el admin carga un pendiente en el día de hoy'
);
select throws_ok(
  $$select public.resolver_cobro_mp((select id from public.cobros_mp where id_mp = 'MP-4'), true)$$,
  'P0001', 'Ese cobro ya se resolvió.', 'no se resuelve dos veces'
);

-- Con la carga automática apagada, todo queda pendiente.
reset role;
update public.configuracion set mp_automatico = false;
set local role service_role;
select is(
  (public.registrar_cobro_mp('MP-5', 1000, now())).estado,
  'pendiente'::public.estado_cobro_mp, 'con la carga automática apagada, queda pendiente'
);

select * from finish();
rollback;
