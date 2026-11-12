-- El día se abre solo con la primera venta y los días viejos se cierran solos.
begin;
select plan(7);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select is(
  (select count(*)::int from public.jornadas where fecha = public.hoy_ar()), 0,
  'el seed deja hoy sin abrir'
);
select lives_ok($$select public.registrar_venta(5000, 'efectivo')$$, 'la primera venta abre el día sola');
select is(
  (select estado::text from public.jornadas where fecha = public.hoy_ar()), 'abierta',
  'el día de hoy quedó abierto'
);
select lives_ok($$select public.registrar_venta(3000, 'digital')$$, 'la segunda venta usa el mismo día');
select is(
  (select total from public.resumen_jornada((select id from public.jornadas where fecha = public.hoy_ar()))),
  8000.00::numeric, 'el resumen suma las dos'
);

-- Un día viejo que quedó abierto se cierra solo con la próxima venta.
reset role;
set local session_replication_role = replica;
update public.jornadas set fecha = public.hoy_ar() - 400 where fecha = public.hoy_ar();
set local session_replication_role = origin;
set local role authenticated;
select lives_ok($$select public.registrar_venta(1000, 'efectivo')$$, 'con un día viejo abierto igual se vende');
reset role;
select results_eq(
  $$select estado::text, diferencia_efectivo, nota_cierre from public.jornadas where fecha = public.hoy_ar() - 400$$,
  $$values ('cerrada', 0.00::numeric, 'Cierre automático')$$,
  'el día viejo se cerró solo, sin diferencia'
);

select * from finish();
rollback;
