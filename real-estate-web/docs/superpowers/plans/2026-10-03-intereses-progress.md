# Ejecución del plan de intereses

Plan: `2026-10-03-intereses.md`. Base: main actualizado `d74dffb`.

- Base: 102 pruebas existentes pasan.
- Regla: un único PR contra main, según instrucción posterior del usuario.
- Cuentas confirmadas: mapu.probe.claude@gmail.com y prueba2@mapu.test; contraseña 123qweasd. Conservar UUID de cuenta existente.
- Docker Desktop no arranca en este host. Probar funciones/RLS con PostgreSQL embebido temporal sin agregar dependencias al producto. No ejecutar migraciones remotas.
- Interfaces: RPC de listado devuelve `{items, seen_before}` con hora del servidor para marcar visto sin depender del reloj del navegador. Servicio devuelve propiedades cargadas en lote y esa frontera.
- Prueba roja: servicio de intereses aún ausente; nueva suite falla por import.
- Ejecución directa; revisión de rama completa al finalizar.
- Implementados: esquema/RLS/RPC, cuestionario privado, resultados paginados, novedades, demanda agregada y acceso desde perfil/navegación.
- Revisión independiente: detectó un criterio indispensable de dormitorios/baños que se omitía en terrenos con tipos mixtos. Corregido y cubierto por regresión SQL roja/verde.
- Interfaz probada con dos sesiones: interés previo, publicación posterior mediante API, coincidencia 84%, motivos, demanda de un usuario, pausa/reactivación, móvil y oscuro; sin errores de página.
- Entrega: consulta atómica `supabase/testing/setup-interests.sql`, regenerable, con cuentas normales y contraseñas bcrypt verificadas. No ejecutada remotamente.
- Límites de verificación: Auth local simulado; no se comprobó GoTrue remoto ni se ejecutó toda la cadena histórica de triggers en el esquema SQL reducido.
- Cierre: 107 pruebas unitarias pasan; compilación de producción con verificación de tipos pasa. SQL incluye paginación de 22 propiedades, orden estable y deduplicación entre páginas/intereses.
- ESLint bloqueado por incompatibilidad existente entre ESLint 9 y el parche de eslint-config-next; la compilación se ejecutó con `--no-lint`. No se modificó esa configuración ajena al alcance.
- Revisión final de la corrección y del SQL combinado: sin otros fallos importantes.
- Corrección tras CI: las aserciones SQL no emitían TAP. Se comparten ahora desde `supabase/tests/property-interest-assertions.inc` y se ejecutan mediante un wrapper pgTAP en CI; el runner local conserva las mismas comprobaciones. El contenedor pg_prove monta solamente el directorio de tests, por lo que el include vive allí con extensión `.inc`. Los scripts CommonJS declaran una excepción específica a la regla de imports de TypeScript. La limitación de lint local había ocultado esos seis errores de scripts; no eran una falla del lint en CI.
