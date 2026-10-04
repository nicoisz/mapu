# Mis intereses y propiedades para ti

## Objetivo y alcance acordado

Los usuarios particulares definen varios intereses mediante un quiz de una pregunta por pantalla. Cada interés es una matriz independiente de características estructuradas, sin texto libre para los criterios. Las propiedades recomendadas muestran un porcentaje explicable de coincidencia. Quien publica conoce la cantidad de personas con intereses compatibles, sin acceder a sus identidades.

El umbral acordado es **mayor al 30%**, no mayor o igual. Terreno y parcela representan el tipo existente `land`, mostrado como «Terrenos / parcelas» en este flujo. Se permite flexibilidad en presupuesto y ubicación.

Primera versión propuesta: avisos internos al acceder a MapU, sin cron, correo, push, IA ni conversiones monetarias automáticas. Esta elección es una suposición explícita del plan, porque no se respondió la pregunta sobre el canal de aviso.

## Experiencia

En `/perfil`, acceso a «Mis intereses» y «Propiedades para ti». Cada interés puede editarse, pausarse, reactivarse o eliminarse. Su título es automático. No habrá otro límite comercial de intereses en esta versión.

Quiz: operación; tipos; comunas; presupuesto y moneda; superficie/dormitorios/baños según los tipos; características; resumen. Una pregunta por pantalla con volver, continuar y «Sin preferencia» cuando aplique. Los rangos numéricos usan controles numéricos, los conjuntos usan checkbox/selectores. Se omiten preguntas que no aplican, y cambiar los tipos elimina criterios incompatibles antes de confirmar. Un interés necesita operación y al menos un tipo; puede omitir el resto. Se conserva el progreso al volver entre pantallas. Guardar sucede únicamente en el resumen.

Operación es obligatoria. Para los demás criterios se permite marcar «Indispensable» o «Preferencia», por defecto preferencia. Una característica no seleccionada no restringe ni suma al porcentaje; varios tipos/comunas son alternativas, no requisitos simultáneos. Jardín y estacionamiento seleccionados son dos preferencias evaluadas por separado.

Flexibilidad de ubicación: comunas principales y comunas alternativas elegidas explícitamente; no se inventan comunas cercanas ni se necesita un servicio geográfico adicional. Flexibilidad de presupuesto: selector 0%, 10%, 20% o 30%, por defecto 0%. Mostrar claramente el máximo nominal y el máximo flexible. Son tolerancias voluntarias, no ampliaciones ocultas.

## Reglas de elegibilidad

Solo propiedades activas, publicadas y no vencidas. Excluir propiedades propias. Intereses pausados no producen resultados, avisos ni demanda. Operación debe coincidir. Todos los criterios indispensables deben cumplirse exactamente; no se amplían con flexibilidad. Si hay filtro de comuna, solo se admiten principales y alternativas elegidas. Si hay presupuesto, solo la misma moneda y valores hasta el máximo flexible. USD y CLP no se comparan numéricamente entre sí. Para arriendo usar `monthly_rent`, para venta `price`; una propiedad sin precio pertinente no es elegible cuando existe presupuesto.

Información numérica ausente no satisface un requisito indispensable. Los booleanos existentes falsos se evalúan como falsos; solo un valor realmente nulo se presenta como «Sin información». No deducir características desde descripción ni fotos.

## Porcentaje propuesto: versión 1

El porcentaje es compatibilidad con preferencias, no probabilidad de compra. Cálculo único en PostgreSQL para que listado, avisos y demanda no discrepen. Los pesos siguientes son una propuesta explícita para revisión:

| Grupo | Peso | Puntuación |
|---|---:|---|
| Tipos | 25 | 1 si el tipo pertenece a los elegidos; 0 en otro caso, salvo indispensable que lo excluye. |
| Ubicación | 25 | 1 en comuna principal; 0.6 en alternativa. |
| Presupuesto | 25 | 1 dentro del máximo nominal; baja linealmente de 1 a 0.5 entre ese máximo y el flexible. |
| Superficie/dormitorios/baños | 15 | Promedio de los criterios aplicables seleccionados: 1 si cumple mínimo, `valor/mínimo` entre 0 y 1 si no; ausente 0. |
| Características | 10 | Fracción de las características seleccionadas que cumple; ausente o falsa 0. |

Solo se incluyen grupos respondidos y aplicables; se renormalizan sus pesos hasta 100. Operación no suma puntos porque ya es obligatoria. Mostrar una explicación por criterio: cumple, difiere o sin información. Presupuesto nominal debe ser positivo; mínimo físico cero se trata como no especificado. El cálculo no depende del número de tipos o comunas seleccionados.

Ejemplo: tipos y presupuesto respondidos, ambos exactos, sin otros criterios: 100%. Un incumplimiento indispensable se excluye incluso con porcentaje alto. Una coincidencia no se puede presentar como 100% si algún criterio puntuable difiere: redondeo final y tope 99 en ese caso.

Puntaje público entero entre 0 y 100: redondear al entero más cercano y aplicar umbral sobre ese mismo entero, evitando tarjetas «30%» en una lista que promete más del 30%. Solo mostrar `score > 30`. Esta regla también se usa en contador, avisos y demanda.

## Listado y novedades

Una propiedad puede coincidir con varios intereses: aparece una vez con su mayor porcentaje y el nombre del interés correspondiente. En empates, desempatar por ID del interés. Ordenar por porcentaje descendente, publicación descendente e ID para una paginación estable de 20 propiedades. Si no hay intereses activos, invitar a crear uno; si no hay coincidencias, permitir ajustar el interés. Un fallo de consulta debe mostrar error y reintento, no «sin coincidencias».

Al acceder a una sesión autenticada se consulta únicamente el contador de novedades; al entrar a la sección se carga el listado. Guardar intereses y terminar una publicación refresca los contadores pertinentes. Sin consultas por cada render, polling ni suscripciones permanentes.

Novedad: propiedad publicada después de la fecha efectiva de creación/reactivación/modificación del interés y después de `interest_matches_seen_at`. Guardar un interés nuevo muestra las propiedades anteriores como resultados existentes, no como avisos nuevos. Editar o reactivar reinicia esa fecha efectiva. Las modificaciones de propiedades no generan novedades en V1; sus porcentajes/resultados actuales sí se recalculan al consultar. Al abrir la sección se marca hasta el instante capturado al iniciar la lectura, únicamente después de una respuesta correcta, para no ocultar publicaciones que aparezcan durante la consulta. No se guarda historial de avisos ni se afirma que un mensaje fue entregado.

## Demanda para el publicador

En sus publicaciones, «N personas tienen intereses compatibles»: usuarios distintos con al menos un interés activo elegible y puntaje mayor al 30%. Excluir al propietario. Desglose 100% y 31–99%, usando la mejor coincidencia por persona. Una cuenta con tres intereses cuenta una vez. El conteo es actual y cambia al modificar o pausar intereses; no prueba vistas, contacto ni intención de compra. Consultarlo en lote para las propiedades del dueño, sin una llamada por tarjeta. Solo el dueño puede consultar esos agregados; no devolver IDs, preferencias, nombres ni correos de interesados.

## Datos y seguridad

Tabla `property_interests`: UUID, `user_id`, filtros JSONB versionados y validados, `is_active`, `created_at`, `updated_at`, `effective_at`. Los filtros tienen esquema cerrado, sin SQL ni texto libre ejecutable. Campos: operación, tipos, comunas principales/alternativas, presupuesto/moneda/tolerancia, mínimos físicos, características y lista de criterios indispensables. Nombres visibles derivados, no persistidos. RLS CRUD exclusivo del dueño; límites de arrays y magnitudes validados en servidor, no solo en UI.

Columna independiente `profiles.interest_matches_seen_at`, sin reutilizar `notifications_seen_at` de likes/mensajes. RPC autenticadas `get_interest_matches`, `get_interest_match_count`, `mark_interest_matches_seen`, `get_owned_property_demand`. Función interna de puntuación revocada para clientes. RPC derivan el usuario de `auth.uid()`, fijan `search_path` y no aceptan un ID de usuario para suplantar identidad. Conteo de demanda valida propiedad propia antes de recorrer intereses de otros. No exponer filtros ajenos como filas públicas.

## Usuarios de prueba

Dos particulares: `user_type=individual`, `platform_role=user`, contraseña solicitada `123qweasd`. Conservar UUID y datos del usuario ya existente. Falta identificar su correo real; el seed local `demo@mapu.local` no confirma la base remota. Antes de producir el SQL de aprovisionamiento, comprobar columnas actuales de `auth.users`/`auth.identities`, proveedor de la cuenta existente y extensiones disponibles. El script debe ser transaccional, explícitamente limitado a los dos correos de prueba e idempotente, sin alterar otros usuarios, borrar propiedades ni resetear la base. No ejecutar en remoto desde esta tarea. Ofrecer Admin Auth como alternativa si el esquema no permite un SQL fiable.

Prueba completa: ambos usuarios pueden buscar y publicar; uno configura un interés, otro publica una propiedad; el primero ve el porcentaje y el segundo el conteo anónimo.

## Validación

Pruebas SQL reales de RLS y RPC con dos identidades: aislamiento, deduplicación, umbral 30/31, moneda, arriendo, indispensables, flexibilidad, datos nulos, vencimiento y own-property. Pruebas UI del quiz, edición, navegación y ambos temas en móvil/escritorio. Preservar publicar por etapas, mapas, favoritos y notificaciones existentes. Medir consultas con datos representativos antes de prometer escalabilidad; agregar índices sobre estado/operación y propietario de intereses según el plan de ejecución real. No introducir una cola o caché anticipadamente.

## Entrega

Fases: cuentas de prueba; persistencia y cálculo; quiz; recomendaciones/avisos; demanda y prueba integral. Implementación en PRs revisables contra `main` actualizado, con migraciones aditivas y feature completa habilitada al finalizar. Este documento y su plan no implementan la función.
