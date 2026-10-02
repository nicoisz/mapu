# Legacy SQL — NO EJECUTAR

Estos scripts son **históricos**. Representan el camino manual que se usó para
construir el esquema actual (aplicados a mano en el SQL Editor, antes de
migraciones). Se conservan solo como referencia de la historia.

**El estado actual está consolidado en `supabase/migrations/`**, en particular
en la migración base `20260904162725_remote_schema.sql` (dump del esquema real
tomado con `supabase db pull`).

Estos scripts contienen patrones que **no** deben volver a ejecutarse:
- drops genéricos de tablas/triggers;
- `CASCADE` no justificado;
- manejo de errores de DDL que termina en `NOTICE` (éxito aparente);
- promoción de superadmin por correo personal (`add-superadmin.sql`).

No los referencies desde `migrations/`, `seed.sql` ni ningún proceso de CI/deploy.
Si necesitas el historial completo, `git log` es la fuente autoritativa.
