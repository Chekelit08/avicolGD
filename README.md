# Avícola GD

Caja diaria y gestión financiera para una carnicería-avícola de barrio. Reemplaza el cuaderno: cargar una venta es tipear el importe y tocar **EFECTIVO** o **DIGITAL**.

> Estado: **Fase 0** (preparación). Por ahora la app muestra la guía de estilo en `/estilo` y no guarda nada.

## Para empezar

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase (ver docs/SUPABASE.md)
npm run dev                  # http://localhost:5173
```

| Comando                           | Qué hace                            |
| --------------------------------- | ----------------------------------- |
| `npm run dev`                     | servidor de desarrollo              |
| `npm test`                        | tests de lógica (Vitest)            |
| `npm run test:e2e`                | tests de punta a punta (Playwright) |
| `npm run lint` / `npm run format` | ESLint / Prettier                   |
| `npm run build`                   | build de producción en `dist/`      |

## Documentación

- [`CLAUDE.md`](CLAUDE.md): stack, reglas de negocio y convenciones.
- [`docs/DECISIONES.md`](docs/DECISIONES.md): decisiones y por qué se tomaron.
- [`docs/SUPABASE.md`](docs/SUPABASE.md): cómo crear el proyecto Supabase gratis.

## Seguridad

En el navegador va solo la clave pública de Supabase. La `service_role` nunca entra al repo ni al front. Los permisos se aplican en la base con Row Level Security.
