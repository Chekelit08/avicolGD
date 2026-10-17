# Avícola GD

Caja diaria y gestión financiera para una carnicería-avícola de barrio. Reemplaza el cuaderno: cargar una venta es tipear el importe y tocar **EFECTIVO** o **DIGITAL**.

- **Mostrador (cajero):** abrir el día, cargar y anular ventas, cerrar con arqueo de efectivo.
- **Dueño (admin):** consulta por día/semana/mes con comparativas, panel con gráficos, egresos, sueldos, ganancia aproximada, usuarios, auditoría y exportación a PDF/Excel para el contador.
- PWA instalable, modo claro y oscuro, pensada para un celular de gama baja.

Todo corre en planes gratuitos: React + Vite en **Cloudflare Pages**, base y login en **Supabase** (Postgres con Row Level Security).

## Para empezar (desarrollo)

```bash
npm install
npx supabase start            # base local (necesita Docker)
npx supabase db reset         # tablas + 60 días de datos de prueba
cp .env.example .env.local    # URL http://127.0.0.1:54321 y ANON_KEY de `npx supabase status`
npm run dev                   # http://localhost:5173
```

Usuarios de prueba (contraseña `avicola-prueba-2026`): `gabriel@avicola.test` (admin), `mostrador@avicola.test` (cajero).

| Comando                                       | Qué hace                                                  |
| --------------------------------------------- | --------------------------------------------------------- |
| `npm run dev`                                 | servidor de desarrollo                                    |
| `npm test`                                    | tests de lógica (Vitest)                                  |
| `npm run test:db`                             | tests de la base y de RLS (pgTAP)                         |
| `npm run test:e2e`                            | tests de punta a punta (Playwright, contra la base local) |
| `npm run lint` / `npm run format`             | ESLint / Prettier                                         |
| `npm run build`                               | build de producción en `dist/`                            |
| `npm run db:tipos`                            | regenera los tipos de TypeScript desde la base local      |
| `node scripts/backup.mjs`                     | exporta la base a CSV/JSON                                |
| `node scripts/crear-admin.mjs "Nombre" email` | crea el primer administrador                              |

## Documentación

- [`docs/GUIA-DUENO.md`](docs/GUIA-DUENO.md): guía de uso de una página, con capturas.
- [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md): publicar en Supabase + Cloudflare Pages.
- [`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md): checklist para el primer día.
- [`docs/BACKUP.md`](docs/BACKUP.md): cómo hacer y guardar backups.
- [`docs/LIMITES.md`](docs/LIMITES.md): límites de los planes gratuitos y qué pasa si se superan.
- [`docs/DECISIONES.md`](docs/DECISIONES.md): decisiones y por qué se tomaron.
- [`CLAUDE.md`](CLAUDE.md): stack, reglas de negocio y convenciones.

## Estructura

```
src/
  pages/            pantallas (Caja, CerrarDia, Ingresar… y admin/ con Consulta, Panel, Egresos, Personal, Usuarios, Auditoria)
  components/       caja/ (visor, teclado, botones de tipo), graficos/, ui/, marco/
  datos/            consultas y mutaciones (TanStack Query)
  lib/              lógica pura con tests: formato, caja, períodos, validación, auditoría
  exportar/         resumen mensual a PDF y Excel (se carga solo al usarlo)
supabase/
  migrations/       esquema, RLS, funciones y reportes
  tests/            tests pgTAP (RLS y reglas de negocio)
  functions/        Edge Function `usuarios` (crear/bloquear cuentas)
  seed.sql          datos de prueba (solo local)
scripts/            backup, primer admin, íconos
e2e/                tests de Playwright
```

## Seguridad

En el navegador va solo la clave pública de Supabase. La `service_role` vive únicamente en la Edge Function (la inyecta Supabase) y en `.env.servidor` en tu compu, para los scripts; nunca en el repo ni en el front. Los permisos se aplican en la base con Row Level Security y están probados con tests.
