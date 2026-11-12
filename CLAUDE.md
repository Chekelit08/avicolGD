# Avícola GD

App web para reemplazar el cuaderno de caja de una carnicería-avícola de barrio (logo: "Gonza — Carnicería · Chanchería · Avícola"). Registra ventas (importe + tipo de pago), cierra el día con arqueo de efectivo y, para el dueño, muestra resúmenes, egresos y sueldos. La usan personas no técnicas, de pie y con apuro: **si algo frena el mostrador, está mal.**

## Stack (todo en planes gratuitos)

- React 19 + TypeScript (estricto) + Vite 8, Tailwind CSS 4, React Router, TanStack Query, React Hook Form + Zod, Recharts, date-fns + `@date-fns/tz`, vite-plugin-pwa.
- Supabase: Postgres + Auth + RLS + Edge Functions (`usuarios`, `mercadopago`) + pg_cron. No hay servidor propio.
- Hosting: Vercel (`vercel.json`) en https://avicola-gd.vercel.app. También sirven Netlify (`netlify.toml`) y Cloudflare Pages (`public/_redirects`, `public/_headers`).
- Exportar: jsPDF + jspdf-autotable, write-excel-file (se cargan con `import()` solo al usarlos).
- Tests: Vitest (`src/**/*.test.ts`), pgTAP (`supabase/tests`), Playwright (`e2e/`).

## Comandos

```bash
npm install
npx supabase start          # base local (Docker). Sin estudio ni storage: ver docs/DESPLIEGUE.md
npx supabase db reset       # migraciones + seed (60 días)
npx supabase functions serve
npm run dev                 # http://localhost:5173
npm run lint && npm run format:check
npm test                    # Vitest
npm run test:db             # pgTAP (requiere db reset reciente: el seed deja hoy sin abrir)
npm run test:e2e            # Playwright; compila y levanta vite preview solo
npm run build
npm run db:tipos            # regenera src/lib/tipos-db.ts después de cambiar migraciones
```

En la nube de Claude Code: `PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e` y nunca `playwright install`. El edge-runtime local no confía en el certificado del proxy: por eso la función `usuarios` no tiene dependencias npm (usa `fetch`).

Proyecto en la nube: Supabase `anadbauxypifiplihpje` (São Paulo). Deploy: ver `docs/DESPLIEGUE.md` (`supabase db push`, `supabase functions deploy usuarios`, Cloudflare Pages con `npm run build` → `dist`).

## Reglas de negocio

La app se simplificó a pedido del dueño (ver `docs/DECISIONES.md`, 12/11/2026): **no se abre ni se cierra el día a mano, no hay arqueo ni salidas de caja en la pantalla.**

1. **El día es automático** (`jornada_de_hoy()`): la primera venta del día crea la jornada; una jornada vieja que quedó abierta se cierra sola (sin diferencia). Sigue habiendo una sola jornada abierta (índice único).
2. Las ventas se cargan con `registrar_venta`, siempre en la jornada de hoy.
3. **Medio de pago: `efectivo` | `digital`**, sin más detalle.
4. **El tipo se elige siempre** y elegirlo guarda: **Enter = Efectivo**, **+ = Digital**; Esc borra. Los botones hacen lo mismo. No hay medio preseleccionado.
5. Las ventas y los gastos no se borran, se anulan con motivo. Un cajero anula ventas de su cuenta con menos de 10 minutos; después, solo admin (y solo del día de hoy).
6. Importe > 0, entero en la carga, máximo $ 9.999.999. Arriba de `configuracion.tope_confirmacion` ($ 500.000) se pide confirmación. Validar en cliente **y** en la base.
7. Cada registro guarda quién y cuándo. Los totales los calcula la base.
8. Roles: `cajero` ("Mostrador": solo la caja) y `admin` ("Dueño": Caja, Resumen, Historial, Gastos, Usuarios). Permisos con RLS. Siempre queda al menos un admin activo.
9. Auditoría: solo se agrega; se llena con triggers (no tiene pantalla).

En la base siguen existiendo, sin pantalla: cierre manual y arqueo (`cerrar_jornada`), `salidas_caja`, empleados, `cobros_mp` y la función `mercadopago`.

Fuera de alcance: inventario/productos, facturación ARCA/AFIP, impresora fiscal, cobrar o devolver por la API de Mercado Pago (solo se **leen** los cobros recibidos, ver `docs/MERCADO-PAGO.md`), apps nativas.

## Convenciones

- Código, tablas, variables y commits **en español** (`jornadas`, `formatearPesos`, `medioPago`).
- Interfaz en español rioplatense con "vos". Verbos claros ("Guardar venta", "Cerrar el día"). Mismo vocabulario en toda la app. Los errores de reglas los escribe la base (`raise exception … using errcode = 'P0001'`) y la app los muestra tal cual (`mensajeDeError`).
- Montos: `numeric(12,2)` en la base, nunca float. En pantalla: `formatearPesos()` y la clase `cifras` (tabular-nums) en columnas.
- Fechas en `America/Argentina/Buenos_Aires`: `fechaDeTrabajo()` en el cliente, `hoy_ar()` en la base. Fechas de trabajo como string `aaaa-mm-dd` (`src/lib/periodos.ts`).
- Colores: solo tokens de `src/styles/app.css`. Efectivo = bordó y Digital = pizarra (botones); en gráficos `--grafico-*` (validados con la skill dataviz). Nunca hex sueltos en componentes.
- Estilo limpio tipo Square / Mercado Pago / Stripe: Inter (`font-texto`), fondo gris claro, tarjetas blancas con borde fino y `shadow-tarjeta`, títulos `text-2xl font-semibold`, íconos de `lucide-react`. Componentes base en `src/components/ui/` (Boton, Campo, Tarjeta, Titulo, Aviso, Chip, Segmentado). El importe se carga con `CampoImporte` (`src/components/caja/`).
- Escritorio con teclado primero (barra lateral en `lg`), y que ande en celular (menú arriba, `inputMode="numeric"`). Objetivos ≥ 44 px, foco visible, contraste AA, `prefers-reduced-motion`.
- Sin `any`. Prettier: sin punto y coma, comillas simples, 100 columnas. Las páginas de admin se cargan con `lazy()`.
- Migraciones versionadas en `supabase/migrations/`, RLS en todas las tablas, tests pgTAP para cada regla nueva.
- Commits chicos en español. Decisiones importantes a `docs/DECISIONES.md`.

## Seguridad: nunca subir claves

- En el cliente va **solo** la clave pública (anon/publishable) vía `.env.local`. `.env.example` documenta las variables.
- **Jamás** la `service_role` en el front, en el repo, en commits ni en logs. Solo en la Edge Function (variable de Supabase) y en `.env.servidor` (ignorado) para `scripts/`.
- `.env.*` y `backups/` están ignorados por git.
