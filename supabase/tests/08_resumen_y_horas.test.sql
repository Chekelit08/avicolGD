-- Horas pico, comparación con la semana pasada y WhatsApp del dueño.
begin;
select plan(8);

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok(
  $$select * from public.ventas_por_hora(current_date - 30, current_date)$$,
  '42501', null, 'el cajero no ve las horas pico'
);
select throws_ok(
  $$select * from public.hoy_contra_semana_pasada()$$, '42501', null,
  'el cajero no ve la comparación con la semana pasada'
);

set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select is(
  (select count(*)::int from public.ventas_por_hora(public.hoy_ar() - 30, public.hoy_ar())), 24,
  'devuelve las 24 horas, aunque no haya ventas'
);
select ok(
  (select sum(promedio_total) from public.ventas_por_hora(public.hoy_ar() - 30, public.hoy_ar())) > 0,
  'con el seed hay ventas promedio por hora'
);
select ok(
  abs(
    (select sum(promedio_total) * max(dias_trabajados)
     from public.ventas_por_hora(public.hoy_ar() - 30, public.hoy_ar()))
    - (select total from public.resumen_periodo(public.hoy_ar() - 30, public.hoy_ar()))
  ) < 24 * 31 * 0.01,
  'la suma de los promedios por hora da el total del período (salvo redondeo)'
);
select ok(
  (select semana_pasada_a_esta_hora <= semana_pasada_total from public.hoy_contra_semana_pasada()),
  'la semana pasada a esta hora no supera su total'
);

select throws_ok(
  $$update public.configuracion set whatsapp_dueno = '+54 9 11 2233'$$, '23514', null,
  'el WhatsApp va solo con dígitos'
);
select lives_ok(
  $$update public.configuracion set whatsapp_dueno = '5491122334455'$$,
  'el admin guarda el WhatsApp del dueño'
);

select * from finish();
rollback;
