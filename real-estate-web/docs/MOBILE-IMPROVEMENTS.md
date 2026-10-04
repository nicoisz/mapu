# Ajustes móviles, intereses y conversaciones

Se mantienen separados **Mis intereses** y **Propiedades para ti**. La segunda entrada se muestra después de guardar al menos un interés. Explorar está en la navegación superior móvil y se oculta en el menú lateral móvil.

## Intereses

- Comunas múltiples, incluso de distintas regiones, con el mismo peso. Se eliminan alternativas e indispensables y se normalizan los intereses anteriores.
- Dormitorios y baños comparten una pregunta.
- El cuestionario conserva un borrador por usuario en el dispositivo. Si falla el envío, queda pendiente y se reintenta al volver al módulo. Un identificador estable evita duplicados cuando el servidor guardó y se perdió la respuesta.
- Los pendientes no se borran al cancelar ni al intentar iniciar otra búsqueda. Se eliminan al confirmar el guardado. Si el navegador bloquea el almacenamiento, se informa al usuario y se conserva el formulario abierto.

## Mensajes y reseñas

La ficha permite iniciar una conversación con el publicador. **Dashboard → Mensajes** permite leer y responder; ambas partes ven el historial, sus mensajes pendientes de lectura y la propiedad asociada. Las conversaciones se actualizan al entrar o pulsar **Actualizar**. No hay suscripción en tiempo real ni correos nuevos.

La base verifica remitente, destinatario y participantes; un tercero no puede leer ni incorporarse a una conversación ajena. Los reintentos son idempotentes, el historial tiene paginación y las respuestas no inflan el contador de contactos.

Las reseñas recibidas están en **Mi perfil → Ver mis reseñas**.

## Diagnósticos

**Panel admin → Log de errores** conserva fecha, actor, ruta y contexto JSON, con filtros pendientes/solucionados y opción de reabrir. Captura errores globales del navegador, rechazos de servicios Supabase, errores explícitos de intereses/mensajes y fallos de publicación en el servidor. Excluye credenciales del contexto. La identidad se verifica en el servidor; se prohíben inserciones directas y solo el administrador puede leer o resolver.

Los fallos del propio registro se descartan para evitar ciclos. Un error ocurrido sin conexión no garantiza entrega del diagnóstico, aunque el borrador del interés permanece localmente.

## Aplicación y verificación

Aplicar ambas migraciones antes de desplegar el frontend:

1. `20261004130000_interest_drafts_and_error_resolution.sql`
2. `20261004140000_message_conversations.sql`

Para el editor SQL también está disponible `supabase/testing/setup-mobile-improvements.sql`, que reúne ambas. No modifica contraseñas ni promueve usuarios.

Pruebas: `npm run test:unit`, `npm run typecheck`, `supabase test db`. Las comprobaciones de seguridad de esta entrega están en `supabase/tests/mobile-system-assertions.inc`; el runner alternativo `scripts/test-mobile-sql.cjs` utiliza el PostgreSQL temporal descrito en `docs/INTERESTS.md`.
