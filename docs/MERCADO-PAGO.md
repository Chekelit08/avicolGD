# Conectar Mercado Pago (una sola vez, 15 minutos)

Cuando esté conectado, cada cobro que entre a la cuenta de Mercado Pago del local aparece solo en la caja como venta **Digital** con la etiqueta "Mercado Pago". Puede ser por QR, por link de pago o por transferencia. En el mostrador no hay que tipearlo.

## Qué entra y qué no

| Entra solo                                                        | No entra (se sigue cargando con **+**)                  |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| Pagos con el QR de Mercado Pago                                   | Tarjeta en un posnet de otro banco                      |
| Links de pago y cobros con Point                                  | Transferencias a una cuenta de banco (CBU)              |
| Transferencias al CVU/alias de Mercado Pago (si MP las informa)\* | Cargas de saldo propias (la app las ignora a propósito) |

\* Mercado Pago informa por su API los cobros hechos con sus productos. Las transferencias que llegan desde un banco al CVU **no siempre** aparecen. Probalo con una transferencia de $ 10 después de conectar. Si no aparece en un par de minutos, esas se siguen cargando a mano con **+**.

**Si el cajero igual la tipea:** la app avisa "Ya entraron $ X solos por Mercado Pago a las 12:04. ¿Es otra venta?". **Enter** la guarda (era otra) y **Esc** la descarta. Al revés pasa lo mismo: si alguien la tipeó primero y después llega el aviso de MP, se asocian y no se cuenta dos veces.

## Pasos

### 1. Crear la aplicación en Mercado Pago

1. Entrá a <https://www.mercadopago.com.ar/developers/panel/app> **con la cuenta de Mercado Pago del local** (la que cobra).
2. **Crear aplicación** → nombre "Avícola GD". Cuando pregunte qué vas a integrar, elegí **Pagos online / Checkout API**. Cualquier opción sirve: lo que necesitamos son las credenciales.
3. Entrá a la aplicación → **Credenciales de producción** → copiá el **Access Token** (empieza con `APP_USR-`).
   Es una clave privada: **no la mandes por WhatsApp ni la pegues en la app**. Va en Supabase, en el paso 3.

### 2. Configurar el aviso (webhook)

1. En la misma aplicación: **Webhooks → Configurar notificaciones**.
2. **URL de producción:** `https://anadbauxypifiplihpje.supabase.co/functions/v1/mercadopago`
3. **Eventos:** marcá **Pagos**.
4. Guardá y copiá la **clave secreta** que aparece ahí (sirve para comprobar que el aviso viene de Mercado Pago).

### 3. Cargar las claves en Supabase

En <https://supabase.com/dashboard/project/anadbauxypifiplihpje/functions/secrets> agregá:

| Nombre              | Valor                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| `MP_ACCESS_TOKEN`   | el Access Token del paso 1                                                 |
| `MP_WEBHOOK_SECRET` | la clave secreta del paso 2                                                |
| `BARRIDO_SECRETO`   | cualquier texto largo al azar (por ejemplo, 40 letras y números mezclados) |

Y en el **SQL Editor** corré esto una vez, con el mismo texto de `BARRIDO_SECRETO`:

```sql
select vault.create_secret('https://anadbauxypifiplihpje.supabase.co/functions/v1/mercadopago', 'mp_funcion_url');
select vault.create_secret('EL-MISMO-TEXTO-DE-BARRIDO_SECRETO', 'mp_barrido_secreto');
```

Esto prende el **barrido de respaldo**: cada 5 minutos la base le pide a Mercado Pago los cobros de las últimas 3 horas, por si algún aviso se perdió. Sin estos dos secretos el barrido no hace nada.

### 4. Probar

1. Entrá a la app como administrador → **Ajustes**. Tiene que decir "Conectado a la cuenta …".
2. Con el día abierto, hacete un pago de $ 10 con el QR del local. En menos de un minuto aparece en la caja con el aviso verde. Si no aparece, en **Ajustes** tocá **Buscar cobros ahora**.
3. Si era una prueba, anulala desde la lista (como admin).

## Cómo funciona por dentro

```text
Cliente paga ──► Mercado Pago ──aviso firmado──► Edge Function `mercadopago`
                                                     │ verifica la firma (HMAC con la clave secreta)
                                                     │ pide el pago a la API de MP con el Access Token
                                                     ▼
                                     registrar_cobro_mp (base, solo con la clave de servicio)
                                     ├─ guarda el cobro una sola vez (id de MP único)
                                     ├─ día de hoy abierto → venta digital "Mercado Pago"
                                     │    (o se asocia a la que ya tipeó el cajero: mismo importe, últimos 15 min)
                                     └─ caja cerrada → queda pendiente; entra sola al abrir el día
pg_cron cada 5 min ──► misma función (barrido de respaldo)
```

- **Pendientes:** los cobros de un día que ya se cerró quedan en **Ajustes → Para revisar**. El admin los carga en la caja de hoy o los marca como "No es una venta", con motivo. Las dos cosas quedan en la auditoría.
- **Apagar la carga automática:** en **Ajustes**, destildá "Cargar solos los cobros en la caja". Los cobros siguen llegando, pero quedan para revisar.
- **Devoluciones:** si un cobro se devuelve en Mercado Pago, la venta no se anula sola. El admin la anula a mano con el motivo.
- **Seguridad:** el Access Token y las claves viven solo en Supabase, nunca en la app ni en el repo. La función rechaza los avisos sin firma válida (401). Un cajero no puede registrar cobros, ver la lista de Mercado Pago ni anular ventas de Mercado Pago.
