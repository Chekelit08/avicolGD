# Despliegue (todo gratis)

Base y login en **Supabase**, la app en **Cloudflare Pages**. Son unos 30 minutos la primera vez.

## 1. Supabase (ya creado)

El proyecto ya existe y tiene todas las tablas, reglas, funciones y la función `usuarios`:

| Dato                                        | Valor                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| Proyecto                                    | `avicola-gd` (ref `anadbauxypifiplihpje`), São Paulo, plan Free                   |
| URL                                         | `https://anadbauxypifiplihpje.supabase.co`                                        |
| Clave publicable (va en la app, es pública) | `sb_publishable_IjOSasVuQ2tvooFd727p3w_qyfmB1Eh`                                  |
| Primer admin                                | `ezeadenett@gmail.com` (pide cambiar la contraseña temporal en el primer ingreso) |

### Pasos manuales que faltan en el panel de Supabase (5 minutos)

1. **Authentication → Sign In / Providers**: apagá **Allow new users to sign up**. (Igual, una cuenta auto-registrada nace inactiva y no puede hacer nada.)
2. **Authentication → Passwords**: largo mínimo **10**.
3. Cuando tengas la dirección de Cloudflare: **Authentication → URL Configuration** → _Site URL_ = esa dirección y _Redirect URLs_ = la misma seguida de `/nueva-clave`.

### Futuras migraciones

Las migraciones se aplicaron con el conector de Supabase, que les puso otras versiones en el historial remoto. Antes del primer `db push` desde tu compu, alineá el historial una sola vez:

```bash
npx supabase login
npx supabase link --project-ref anadbauxypifiplihpje
npx supabase migration list                      # muestra las versiones remotas y locales
npx supabase migration repair --status reverted <cada versión remota que no está en el repo>
npx supabase migration repair --status applied 20261017000001 20261017000002 20261017000003 20261017000004 20261017000005 20261017000006 20261017000007
npx supabase db push                             # desde acá, solo aplica migraciones nuevas
```

### Si alguna vez hay que crearlo de cero

```bash
npx supabase link --project-ref TU-PROJECT-REF
npx supabase db push
npx supabase functions deploy usuarios
node scripts/crear-admin.mjs "Nombre" email@ejemplo.com   # con .env.servidor (ver BACKUP.md)
```

`db push` **no** carga los datos de prueba (`seed.sql` es solo para desarrollo local).

## 2. Cloudflare Pages

1. Entrá a <https://dash.cloudflare.com> → **Workers & Pages → Create → Pages → Connect to Git** y elegí el repo `avicolGD`.
2. Configuración del build:
   - _Framework preset_: **Vite** (o ninguno)
   - _Build command_: `npm run build`
   - _Build output directory_: `dist`
   - _Variables de entorno_ (Production y Preview):
     - `VITE_SUPABASE_URL` = `https://anadbauxypifiplihpje.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_IjOSasVuQ2tvooFd727p3w_qyfmB1Eh` (la **pública**)
     - `NODE_VERSION` = `22`
3. **Save and Deploy.** Cada push a la rama principal publica solo.

Ya vienen en `public/`:

- `_redirects`: hace que las rutas de la app (`/cerrar`, `/panel`, …) funcionen al recargar.
- `_headers`: cabeceras de seguridad. La política de contenido permite conectarse solo a `*.supabase.co`. Si algún día usás un dominio propio para Supabase, agregalo en `connect-src`.

## 3. Instalar la app en el local

- **Android (Chrome):** abrí la dirección → menú ⋮ → **Instalar app** (o _Agregar a la pantalla principal_).
- **iPhone (Safari):** botón Compartir → **Agregar a inicio**.
- **Compu (Chrome/Edge):** ícono de instalar en la barra de direcciones.

Iniciá sesión con la cuenta **Mostrador** y dejala abierta.

## 4. Verificar

Seguí el checklist de [`PUESTA-EN-MARCHA.md`](PUESTA-EN-MARCHA.md).

## Desarrollo local

```bash
npx supabase start          # necesita Docker
npx supabase db reset       # migraciones + datos de prueba de 60 días
npx supabase functions serve # (otra terminal) la función de usuarios
cp .env.example .env.local  # URL http://127.0.0.1:54321 y la ANON_KEY de `npx supabase status`
npm run dev
```

Usuarios de prueba locales (contraseña `avicola-prueba-2026`): `gabriel@avicola.test` y `ezequiel@avicola.test` (admin), `mostrador@avicola.test` (cajero).
