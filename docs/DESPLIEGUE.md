# Despliegue (todo gratis)

Base y login en **Supabase**, la app en **Cloudflare Pages**. Son unos 30 minutos la primera vez.

## 1. Supabase

1. Creá el proyecto siguiendo [`SUPABASE.md`](SUPABASE.md) (región São Paulo, plan Free).
2. En tu compu, desde la carpeta del repo:

   ```bash
   npx supabase login
   npx supabase link --project-ref TU-PROJECT-REF   # está en la URL del panel
   npx supabase db push                             # crea tablas, reglas (RLS) y funciones
   npx supabase functions deploy usuarios           # función para crear cuentas desde la app
   ```

   `db push` **no** carga los datos de prueba (`seed.sql` es solo para desarrollo local).

3. **Authentication → URL Configuration**
   - _Site URL_: la dirección final de la app, por ejemplo `https://avicola-gd.pages.dev`
   - _Redirect URLs_: la misma, seguida de `/nueva-clave` (para recuperar la contraseña)
4. **Authentication → Sign In / Providers**
   - _Allow new users to sign up_: **apagado** (las cuentas las crea un admin).
   - Email: **prendido**. _Confirm email_ puede quedar prendido; las cuentas creadas desde la app ya vienen confirmadas.
5. **Authentication → Passwords**: largo mínimo **10**.
6. Crear el primer administrador (el dueño). Copiá la _service_role key_ de **Project Settings → API** en un archivo `.env.servidor` (git lo ignora; **nunca** lo subas ni lo compartas):

   ```bash
   # .env.servidor
   SUPABASE_URL=https://TU-PROYECTO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

   ```bash
   node scripts/crear-admin.mjs "Gabriel" gabriel@ejemplo.com
   ```

   Después, todas las demás cuentas (incluida la compartida **Mostrador**, con rol cajero) se crean desde **Usuarios** en la app.

## 2. Cloudflare Pages

1. Entrá a <https://dash.cloudflare.com> → **Workers & Pages → Create → Pages → Connect to Git** y elegí el repo `avicolGD`.
2. Configuración del build:
   - _Framework preset_: **Vite** (o ninguno)
   - _Build command_: `npm run build`
   - _Build output directory_: `dist`
   - _Variables de entorno_ (Production y Preview):
     - `VITE_SUPABASE_URL` = `https://TU-PROYECTO.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = la clave **pública** (anon / publishable)
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
