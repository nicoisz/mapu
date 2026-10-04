# Intereses y propiedades para ti

Un usuario puede guardar varios intereses privados mediante un cuestionario, editarlos, pausarlos o eliminarlos. Terrenos y parcelas usan la categoría `land`. Los resultados muestran el mejor porcentaje por propiedad, sin duplicarla entre intereses. Se muestran solamente porcentajes mayores a 30%.

Las preferencias pueden ser indispensables. La flexibilidad de presupuesto es explícita (0%, 10%, 20% o 30%); las comunas alternativas también se eligen explícitamente. No se convierten monedas. Los motivos indican coincidencias, diferencias y datos desconocidos.

El publicador ve solamente cantidades agregadas de usuarios interesados, separadas entre coincidencias completas y parciales. No recibe identidades ni preferencias privadas. Las publicaciones propias, vencidas o sin publicar se excluyen.

## Configuración

Ejecutar **todo** `supabase/testing/setup-interests.sql` en el SQL Editor de Supabase antes de usar la nueva interfaz. Es una transacción que instala la migración y prepara las dos cuentas de prueba autorizadas. Se puede volver a ejecutar; conserva UUID, nombre y propiedades de la cuenta existente. Restablece las contraseñas de estas dos cuentas y las deja como usuarios normales, particulares, con correo confirmado:

| Email                       | Contraseña |
| --------------------------- | ---------- |
| mapu.probe.claude@gmail.com | 123qweasd  |
| prueba2@mapu.test           | 123qweasd  |

Estas credenciales son para pruebas. La consulta no se ha ejecutado en la base remota. El acceso real a Supabase debe comprobarse después de ejecutarla.

En entornos sin esas cuentas de prueba, aplicar solamente `supabase/migrations/20261003120000_property_interests.sql` mediante el flujo habitual de migraciones. Para regenerar el archivo combinado: `node scripts/build-interest-setup.cjs`.

## Uso y notificaciones

- Perfil → Mis intereses: crear y administrar preferencias.
- Propiedades para ti (`/para-ti`): consultar resultados y motivos. Paginación de 20 propiedades, ordenadas por porcentaje.
- Dashboard: consultar demanda agregada de las propiedades propias.
- El indicador de novedades se consulta al iniciar sesión y se actualiza después de cambiar intereses o publicar. Abrir la primera página de resultados marca como vistas las publicaciones anteriores a la hora que devuelve el servidor. Una publicación posterior sigue siendo nueva.
- Crear, editar o reactivar un interés empieza una nueva ventana de novedades. No hay cron, correos ni notificaciones externas en esta versión.

## Verificación

Pruebas unitarias: `npm test`. Tipos: `npm run typecheck`.

Las pruebas SQL usan PostgreSQL embebido (PGlite) instalado fuera del producto. En PowerShell:

```powershell
$qaRuntime = Join-Path $env:TEMP 'mapu-interest-sql-runtime'
npm install --prefix $qaRuntime --no-audit --no-fund @electric-sql/pglite bcryptjs
$env:MAPU_SQL_RUNTIME_DIR = $qaRuntime
node scripts/build-interest-setup.cjs
node scripts/test-interest-sql.cjs
```

Comprueban puntuación, umbral 30/31, criterios indispensables, flexibilidad, monedas, demanda sin duplicados, aislamiento RLS, novedades, provisión idempotente y contraseñas bcrypt. El esquema de Auth de esta prueba es reducido; no sustituye una prueba de acceso con GoTrue en el entorno real.

La prueba de interfaz local usa dos sesiones con transporte de Auth simulado y funciones PostgreSQL reales: cuestionario, publicación mediante `/api/publish`, coincidencia parcial del 84%, motivos, demanda, pausa/reactivación, móvil y modo oscuro. No se han desplegado cambios ni ejecutado migraciones remotas.
