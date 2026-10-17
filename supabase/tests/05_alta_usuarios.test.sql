-- El alta de usuarios desde el servidor deja el perfil con el rol correcto.
begin;
select plan(4);

-- Así crea Auth un usuario: primero el insert, después escribe app_metadata.
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
        'nueva@avicola.test', '{"provider": "email"}', '{"nombre": "Nueva"}', now(), now());
select is((select rol::text from public.perfiles where email = 'nueva@avicola.test'), 'cajero', 'al insertar queda cajero por defecto');

update auth.users set raw_app_meta_data = raw_app_meta_data || '{"rol": "admin", "debe_cambiar_clave": true}'
where id = 'b0000000-0000-4000-8000-000000000001';
select is(
  (select rol::text || '|' || debe_cambiar_clave::text from public.perfiles where email = 'nueva@avicola.test'),
  'admin|true', 'el rol y la clave temporal del servidor llegan al perfil'
);
select is(
  (select count(*)::int from public.auditoria where registro_id = 'b0000000-0000-4000-8000-000000000001'),
  0, 'la sincronización del alta no ensucia la auditoría'
);

-- Cambiar otros datos de auth (por ejemplo, el último ingreso) no pisa el rol cambiado desde la app.
update public.perfiles set rol = 'cajero' where id = 'b0000000-0000-4000-8000-000000000001';
update auth.users set last_sign_in_at = now() where id = 'b0000000-0000-4000-8000-000000000001';
select is((select rol::text from public.perfiles where email = 'nueva@avicola.test'), 'cajero', 'el rol de la app no se pisa');

select * from finish();
rollback;
