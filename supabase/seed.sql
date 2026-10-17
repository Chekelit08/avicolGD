-- =============================================================================
-- Datos de prueba para desarrollo local (npx supabase db reset).
-- NO se usa en producción: el primer admin real se crea con scripts/crear-admin.mjs.
--
-- Usuarios (contraseña para todos: avicola-prueba-2026)
--   gabriel@avicola.test   admin  (dueño)
--   ezequiel@avicola.test  admin
--   mostrador@avicola.test cajero (cuenta compartida del mostrador)
--
-- 60 días de ventas (domingos cerrado), egresos y sueldos. Hoy queda sin abrir,
-- para poder probar "Abrir el día".
-- =============================================================================

-- Los triggers de reglas y auditoría se apagan durante la carga masiva.
set session_replication_role = replica;

select setseed(0.42);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('avicola-prueba-2026', extensions.gen_salt('bf')), now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'rol', u.rol),
  jsonb_build_object('nombre', u.nombre), now(), now(), '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'gabriel@avicola.test', 'Gabriel', 'admin'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'ezequiel@avicola.test', 'Ezequiel', 'admin'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'mostrador@avicola.test', 'Mostrador', 'cajero')
) as u (id, email, nombre, rol);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users
where email like '%@avicola.test';

insert into public.perfiles (id, nombre, rol) values
  ('a0000000-0000-4000-8000-000000000001', 'Gabriel', 'admin'),
  ('a0000000-0000-4000-8000-000000000002', 'Ezequiel', 'admin'),
  ('a0000000-0000-4000-8000-000000000003', 'Mostrador', 'cajero');

-- Jornadas: últimos 60 días, sin domingos y sin hoy.
-- Se cargan ya cerradas (la base no admite dos abiertas); el arqueo se completa más abajo.
insert into public.jornadas (
  id, fecha, estado, fondo_inicial, abierta_por, abierta_en,
  cerrada_por, cerrada_en, efectivo_contado, diferencia_efectivo
)
select gen_random_uuid(), d::date, 'cerrada',
       (array[0, 5000, 10000, 10000, 20000])[1 + floor(random() * 5)::int],
       'a0000000-0000-4000-8000-000000000003',
       (d::date + time '08:00') at time zone 'America/Argentina/Buenos_Aires',
       'a0000000-0000-4000-8000-000000000003',
       (d::date + time '20:30') at time zone 'America/Argentina/Buenos_Aires',
       0, 0
from generate_series(public.hoy_ar() - 60, public.hoy_ar() - 1, interval '1 day') d
where extract(isodow from d) <> 7;

-- Ventas: más los viernes y sábados, tickets de $ 1.500 a $ 60.000 aprox.
insert into public.ventas (jornada_id, importe, medio_pago, registrada_por, registrada_en)
select j.id,
       greatest(800, round((exp(ln(6500) + 0.65 * sqrt(-2 * ln(random())) * cos(2 * pi() * random()))) / 100) * 100),
       case when random() < 0.58 then 'efectivo'::public.medio_pago else 'digital'::public.medio_pago end,
       'a0000000-0000-4000-8000-000000000003',
       (j.fecha + time '08:30' + (random() * interval '11 hours')) at time zone 'America/Argentina/Buenos_Aires'
from public.jornadas j
cross join lateral generate_series(
  1,
  (case extract(isodow from j.fecha)
     when 5 then 75 when 6 then 95 when 1 then 40 else 52 end
   + floor(random() * 20))::int
) n;

-- Unas pocas anuladas (errores de tipeo).
update public.ventas
set anulada = true,
    anulada_por = registrada_por,
    anulada_en = registrada_en + interval '2 minutes',
    motivo_anulacion = 'Error de tipeo'
where random() < 0.012;

-- Arqueo de cada día, casi siempre exacto.
update public.jornadas j
set efectivo_contado = e.esperado + e.diferencia,
    diferencia_efectivo = e.diferencia,
    nota_cierre = case when e.diferencia < 0 then 'Faltó cambio, revisar' end
from (
  select j2.id,
         j2.fondo_inicial + coalesce(sum(v.importe) filter (where not v.anulada and v.medio_pago = 'efectivo'), 0) as esperado,
         case when random() < 0.8 then 0 else (array[-1500, -500, 200, 1000])[1 + floor(random() * 4)::int] end as diferencia
  from public.jornadas j2
  left join public.ventas v on v.jornada_id = j2.id
  group by j2.id
) e
where e.id = j.id;

-- Egresos de los últimos meses.
insert into public.egresos (fecha, categoria_id, descripcion, proveedor, monto, medio_pago, registrado_por)
select d::date, c.id, x.descripcion, x.proveedor, x.monto, x.medio::public.medio_pago,
       'a0000000-0000-4000-8000-000000000001'
from generate_series(date_trunc('month', public.hoy_ar() - 60), public.hoy_ar() - 1, interval '1 month') d
cross join (values
  ('Alquiler', 'Alquiler del local', 'Inmobiliaria Centro', 850000, 'digital'),
  ('Servicios', 'Luz', 'Edenor', 145000, 'digital'),
  ('Servicios', 'Gas', 'Naturgy', 38000, 'digital'),
  ('Servicios', 'Internet', 'Fibertel', 24000, 'digital'),
  ('Impuestos', 'Monotributo', 'ARCA', 95000, 'digital'),
  ('Impuestos', 'Tasa municipal', 'Municipalidad', 31000, 'efectivo')
) as x (categoria, descripcion, proveedor, monto, medio)
join public.categorias_egreso c on c.nombre = x.categoria
where d::date + 4 <= public.hoy_ar();

-- Mercadería: dos compras por semana.
insert into public.egresos (fecha, categoria_id, descripcion, proveedor, monto, medio_pago, registrado_por)
select d::date,
       (select id from public.categorias_egreso where nombre = 'Mercadería'),
       case when extract(isodow from d) = 2 then 'Pollo y menudencias' else 'Media res y cerdo' end,
       case when extract(isodow from d) = 2 then 'Granja Don Luis' else 'Frigorífico Sur' end,
       round((case when extract(isodow from d) = 2 then 900000 else 1600000 end) * (0.85 + random() * 0.3) / 1000) * 1000,
       case when random() < 0.5 then 'efectivo'::public.medio_pago else 'digital'::public.medio_pago end,
       'a0000000-0000-4000-8000-000000000001'
from generate_series(public.hoy_ar() - 60, public.hoy_ar() - 1, interval '1 day') d
where extract(isodow from d) in (2, 5);

insert into public.egresos (fecha, categoria_id, descripcion, proveedor, monto, medio_pago, registrado_por)
values (
  public.hoy_ar() - 20,
  (select id from public.categorias_egreso where nombre = 'Mantenimiento'),
  'Service de la cámara de frío', 'Refrigeración Martínez', 180000, 'efectivo',
  'a0000000-0000-4000-8000-000000000001'
);

-- Personal.
insert into public.empleados (id, nombre, fecha_ingreso, nota) values
  ('e0000000-0000-4000-8000-000000000001', 'Marcos Ríos', '2023-03-01', 'Mostrador, turno mañana'),
  ('e0000000-0000-4000-8000-000000000002', 'Lucía Benítez', '2024-08-15', 'Mostrador, turno tarde');

insert into public.pagos_empleados (empleado_id, fecha, tipo, periodo, monto, medio_pago, registrado_por)
select e.id, (m + interval '1 month' + interval '4 days')::date, 'sueldo', m::date,
       case when e.nombre like 'Marcos%' then 780000 else 650000 end,
       'digital', 'a0000000-0000-4000-8000-000000000001'
from public.empleados e
cross join generate_series(date_trunc('month', public.hoy_ar() - 90), date_trunc('month', public.hoy_ar()) - interval '1 month', interval '1 month') m
where (m + interval '1 month' + interval '4 days')::date < public.hoy_ar();

insert into public.pagos_empleados (empleado_id, fecha, tipo, periodo, monto, medio_pago, nota, registrado_por)
values (
  'e0000000-0000-4000-8000-000000000002', public.hoy_ar() - 6, 'adelanto',
  date_trunc('month', public.hoy_ar())::date, 100000, 'efectivo', 'Pidió adelanto',
  'a0000000-0000-4000-8000-000000000001'
);

set session_replication_role = origin;
