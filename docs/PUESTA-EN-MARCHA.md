# Checklist de puesta en marcha

Marcá cada paso. Si alguno falla, frená y revisalo antes de seguir.

## Preparación (Ezequiel)

- [ ] Proyecto Supabase creado en São Paulo, plan Free ([`SUPABASE.md`](SUPABASE.md)).
- [ ] `npx supabase db push` sin errores.
- [ ] `npx supabase functions deploy usuarios` sin errores.
- [ ] Auth: registro público **apagado**, contraseña mínima 10, Site URL y Redirect URL con la dirección de la app.
- [ ] Primer admin creado con `scripts/crear-admin.mjs`.
- [ ] Cloudflare Pages publicado con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la **pública**).
- [ ] Revisado que la _service_role key_ **no** está en el repo, ni en Cloudflare, ni en ningún chat.
- [ ] `.env.servidor` guardado solo en tu compu.

## Prueba completa (15 minutos, con el dueño)

- [ ] El dueño entra con su cuenta y ve todas las secciones.
- [ ] Desde **Usuarios**, crear la cuenta **Mostrador** (rol cajero) y anotar la contraseña temporal.
- [ ] Entrar como Mostrador en el celular del local: pide elegir contraseña nueva.
- [ ] Mostrador **no** ve Egresos, Personal, Panel ni Usuarios.
- [ ] Instalar la app en el celular o la compu del local (ícono de la vaca).
- [ ] Abrir el día con un fondo de caja.
- [ ] Cargar 3 ventas (2 en efectivo, 1 digital) y ver que el total sube.
- [ ] Anular una venta con motivo: queda tachada y no suma.
- [ ] Probar con el wifi apagado: aparece "Sin internet" y la venta **no** se guarda. Prender y reintentar.
- [ ] Cerrar el día: el arqueo da la diferencia correcta.
- [ ] Intentar cargar una venta después de cerrar: no deja.
- [ ] El dueño ve el día en **Consulta** y lo **reabre**; aparece en **Auditoría**. Volver a cerrarlo.
- [ ] Cargar un egreso y un pago de sueldo de prueba, y después anular el egreso y borrar el pago.
- [ ] Descargar el PDF y el Excel del mes y abrirlos.
- [ ] Hacer el primer backup (`node scripts/backup.mjs`) y guardarlo en dos lugares.

## Primera semana

- [ ] Usar la app **y** el cuaderno en paralelo 2 o 3 días, y comparar los totales al cierre.
- [ ] Imprimir [`GUIA-DUENO.md`](GUIA-DUENO.md) y dejarla en el mostrador.
- [ ] Dejar de usar el cuaderno. 🎉
- [ ] Agendar un backup semanal (por ejemplo, los lunes).
