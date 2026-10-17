# Avícola GD

App web para reemplazar el cuaderno de caja de una carnicería-avícola de barrio (logo: "Gonza — Carnicería · Chanchería · Avícola"). Registra ventas (importe + tipo de pago), cierra el día con arqueo de efectivo y, para el dueño, muestra resúmenes, egresos y sueldos. La usan personas no técnicas, de pie y con apuro: **si algo frena el mostrador, está mal.**

## Stack (todo en planes gratuitos)

- React 19 + TypeScript (estricto) + Vite 8, Tailwind CSS 4, React Router, TanStack Query, React Hook Form + Zod, Recharts (Fase 2), date-fns + `@date-fns/tz`.
- Supabase: Postgres + Auth + RLS. No hay servidor propio.
- Hosting: Cloudflare Pages.
- Tests: Vitest (lógica), tests SQL de RLS (Fase 1), Playwright (e2e).

## Comandos

```bash
npm install            # instalar
npm run dev            # desarrollo en http://localhost:5173
npm run lint           # ESLint
npm run format         # Prettier (format:check para verificar)
npm test               # Vitest
npm run test:e2e       # Playwright (compila y levanta vite preview solo)
npm run build          # typecheck + build de producción en dist/
npx supabase start     # base local (necesita Docker)
npx supabase db reset  # recrea la base local con migraciones + seed
```

En la nube de Claude Code, Playwright usa el Chromium preinstalado: `PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e`. Nunca correr `playwright install` ahí.

Deploy (Fase 1): Cloudflare Pages con build `npm run build` y salida `dist`. Ver `docs/DESPLIEGUE.md` cuando exista.

## Reglas de negocio (resumen, no negociables)

1. Una sola jornada abierta a la vez. Si quedó abierta una de un día anterior, hay que cerrarla antes de abrir otra.
2. Las ventas solo se cargan en una jornada abierta. Una jornada cerrada queda bloqueada y solo un admin la reabre (queda en auditoría).
3. **Medio de pago: `efectivo` | `digital`**, sin más detalle. Se usa igual en ventas, egresos y pagos a empleados.
4. **El tipo se elige siempre.** No hay medio preseleccionado: los botones EFECTIVO y DIGITAL son los que guardan la venta.
5. Las ventas no se borran, se anulan con motivo. La cuenta Mostrador puede anular ventas de Mostrador con menos de 10 minutos en la jornada abierta. Después, solo un admin.
6. Importe > 0 y entero en la carga (sin centavos). Arriba de $ 500.000 (configurable) se pide confirmación. Validar en cliente (Zod) **y** en la base (CHECK/constraints).
7. Efectivo esperado = fondo inicial + ventas en efectivo no anuladas. Diferencia = contado − esperado.
8. Cada registro guarda quién y cuándo. Los totales los calcula la base (vistas/funciones SQL), no el navegador.
9. Roles: `cajero` (una cuenta compartida "Mostrador") y `admin` (cuentas personales). Los permisos se aplican con RLS en la base, no solo ocultando botones.

Fuera de alcance: inventario/productos, facturación ARCA/AFIP, impresora fiscal, API de Mercado Pago, apps nativas.

## Convenciones

- Código, nombres de tablas, variables y commits **en español** (`jornadas`, `formatearPesos`, `medioPago`). Las palabras clave de librerías quedan como son (`useState`).
- Interfaz en español rioplatense con "vos". Verbos claros ("Guardar venta", "Cerrar el día"). Mismo vocabulario en toda la app.
- Montos: `numeric(12,2)` en la base, nunca float. En pantalla: `formatearPesos()` de `src/lib/formato.ts` y la clase `cifras` (tabular-nums).
- Fechas y horas siempre en `America/Argentina/Buenos_Aires` con los helpers de `src/lib/formato.ts`. Fecha de trabajo = `fechaDeTrabajo()`.
- Colores: solo tokens de `src/styles/app.css` (`bg-efectivo`, `text-suave`, etc.), nunca hex sueltos en componentes. Efectivo = bordó, Digital = pizarra, siempre.
- Tipografías: `font-cartel` (Big Shoulders Display) solo para títulos y rótulos; `font-texto` (Atkinson Hyperlegible Next) para todo lo demás; `font-visor` (DSEG7) solo en el visor del importe.
- Táctil primero: objetivos de toque ≥ 48 px (teclas de la caja: 64 px). Foco visible, contraste AA, `prefers-reduced-motion` respetado.
- Sin `any`. Prettier: sin punto y coma, comillas simples, 100 columnas.
- Migraciones SQL versionadas en `supabase/migrations/`. RLS activado en todas las tablas.
- Commits chicos y descriptivos en español. Trabajo por fases: al terminar una, frenar y esperar aprobación.
- Decisiones importantes van a `docs/DECISIONES.md`.

## Seguridad: nunca subir claves

- En el cliente va **solo** la clave pública (anon/publishable) de Supabase, vía `.env.local` (ignorado por git). `.env.example` documenta las variables.
- **Jamás** la `service_role` / secret key en el front, en el repo, en commits ni en logs.
- `backups/` está ignorado: tiene datos reales del negocio.
