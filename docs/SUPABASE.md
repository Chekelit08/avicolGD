# Crear el proyecto Supabase (gratis)

Son unos 10 minutos. No hace falta tarjeta.

1. Entrá a <https://supabase.com> e iniciá sesión con tu cuenta de GitHub.
2. **New project**:
   - Name: `avicola-gd`
   - Database password: generá una larga y guardala en tu gestor de contraseñas (no en el repo).
   - Region: **South America (São Paulo)**, la más cercana a Argentina.
   - Plan: Free.
3. Cuando termine de crearse, andá a **Project Settings → API** y copiá:
   - **Project URL**
   - La clave **anon / publishable** (la pública).
   - ⚠️ La `service_role` / secret key **no** se copia a ningún lado del proyecto.
4. En tu compu, en la carpeta del repo:
   ```bash
   cp .env.example .env.local
   # editá .env.local y pegá la URL y la clave pública
   ```
5. **Authentication → Sign In / Providers → Email**: desactivá "Allow new users to sign up". Las cuentas las crea el admin desde la app.
6. **Authentication → Policies (Password)**: largo mínimo 10.
7. Vincular la CLI (lo hacemos juntos en la Fase 1, cuando haya migraciones):
   ```bash
   npx supabase login
   npx supabase link --project-ref TU-PROJECT-REF
   npx supabase db push
   ```

## Cosas a tener en cuenta del plan gratuito

- **Pausa por inactividad:** Supabase pausa los proyectos gratuitos que pasan cerca de una semana sin actividad. Con el uso diario del local no debería pasar, pero en vacaciones sí. Se reactiva a mano desde el panel.
- **Backups:** el plan gratis no garantiza backups que puedas descargar. En la Fase 4 hay un script de exportación; hasta entonces, no hay datos reales que perder.
- Los límites (tamaño de base, usuarios, ancho de banda) cambian. Revisalos en <https://supabase.com/pricing> antes de la puesta en marcha.

Si preferís, puedo crear el proyecto yo con el conector de Supabase de esta sesión. Decímelo y en qué organización.
