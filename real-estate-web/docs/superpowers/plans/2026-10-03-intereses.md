# Mis intereses — plan de implementación por fases

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Ejecutar directamente en esta sesión; no delegar sin autorización adicional.

**Goal:** Crear intereses mediante quiz, mostrar propiedades con más del 30% de coincidencia y contar demanda anónima para propietarios.

**Architecture:** Intereses privados y puntuación única en PostgreSQL. La interfaz consulta resultados y avisos al acceder, sin cron; demanda y novedades usan exactamente las mismas reglas. Reutilizar cards, perfil, sesión y notificaciones existentes.

**Tech Stack:** Next.js/React, TypeScript, Supabase/PostgreSQL, componentes existentes, Vitest y verificación local en navegador; sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-03-intereses-design.md`.

## Restricciones globales

- Solo mostrar `score > 30` después de redondear al entero visible.
- Terreno/parcela = `land`; no cambiar enum ni migrar tipos.
- Operación obligatoria; otros criterios admiten preferencia/indispensable.
- Avisos internos, sin cron, correo, push, IA ni conversión monetaria automática.
- Intereses privados; demanda solo agregada y solo para el propietario.
- Leer y actualizar `main` al iniciar implementación; conservar trabajo local ajeno y separar de PR #97.
- No ejecutar SQL de cuentas ni migraciones en remoto sin una instrucción posterior que lo autorice.

## Foco de revisión

1. Precio de arriendo: evaluar `monthly_rent`, nunca precio de venta.
2. Una cuenta con varios intereses: una sola propiedad/una sola persona contada.
3. Recomendación parcial: no debe saltarse indispensables ni tolerancias elegidas.
4. Publicación concurrente a marcar visto: conservar su indicador de novedad.
5. Cambio de tipos durante el quiz: eliminar preferencias incompatibles, sin arrastrar dormitorios a terrenos.

## Archivos y responsabilidades

- `supabase/migrations/20261003120000_property_interests.sql`: tabla, RLS, columna seen, validación, puntuación y RPC.
- `supabase/tests/property_interests.sql`: pruebas transaccionales de reglas y aislamiento con identidades de prueba.
- `src/types/interests.ts`: contratos de filtros, resultados y demanda.
- `src/services/interestsService.ts`: acceso autenticado y adaptación de RPC, propagando errores.
- `src/components/interests/InterestQuiz.tsx`: preguntas, validación y resumen.
- `src/components/interests/InterestSummary.tsx`: explicación y edición de interés.
- `src/app/(app)/intereses/page.tsx`: CRUD y pausado de intereses.
- `src/app/(app)/para-ti/page.tsx`: listado paginado y motivos del porcentaje.
- `src/app/(app)/perfil/page.tsx`: accesos a las dos secciones.
- `src/components/property/PropertyCard.tsx`: porcentaje opcional, sin modificar otras cards.
- `src/contexts/AuthContext.tsx` y componentes de navegación existentes localizados al ejecutar: refresco acotado de contador y acceso a novedades.
- `src/app/(app)/notificaciones/page.tsx`: acceso a las coincidencias sin mezclar timestamp de likes/mensajes.
- Página existente de publicaciones propias localizada al ejecutar: demanda en lote; no ampliar la enorme página de publicar si no es necesario.
- `src/lib/__tests__/interestsService.test.ts`: contratos/error handling; pruebas de quiz con la infraestructura ya disponible, o navegador si no existe harness DOM.

## Fase 0 — cuentas de prueba

**Entregable:** script de aprovisionamiento entregado al usuario; cuentas normales verificables, sin ejecutar en remoto.

- [ ] Identificar con el usuario el correo de la cuenta existente y acordar el segundo correo. Inspeccionar el esquema Auth de destino mediante consulta de solo lectura que el usuario puede ejecutar.
- [ ] Crear `supabase/testing/provision-interest-users.sql` con ambos correos explícitos, contraseña `123qweasd`, conservación del UUID existente, identidad email válida y perfil normal. Si el esquema no está verificado, entregar las consultas de inspección y alternativa Admin Auth, sin simular que el SQL está probado.
- [ ] Probar dos ejecuciones en Supabase local: mismos UUID, dos identidades email, perfiles particulares/user; iniciar sesión con ambas cuentas. No borrar propiedades ni modificar otras cuentas.
- [ ] Guardar el script/documentación en commit propio. Datos de propiedades de prueba solo en fixture aislado, no como publicación remota automática.

## Fase 1 — intereses privados y motor de coincidencias

**Interfaces:** `InterestFilters`, `PropertyInterest`, `InterestMatch { propertyId, interestId, score, reasons, isNew }`, `PropertyDemand { propertyId, users, exactUsers, partialUsers }` en `src/types/interests.ts`. RPC `get_interest_matches(page_size integer default 20, page_offset integer default 0)`, `get_interest_match_count()`, `mark_interest_matches_seen(seen_before timestamptz)`, `get_owned_property_demand(property_ids uuid[])`. `score_property_interest(property_id uuid, interest_id uuid)` interna devuelve elegibilidad, entero visible y razones según spec.

- [ ] Escribir primero pruebas SQL: 30 excluido y 31 incluido; renormalización de grupos omitidos; 100 solo cuando todos cumplen; alternativas de comuna 0.6; presupuesto 10% flexible; límites monetarios; arriendo; dato ausente; indispensables; activo/no vencido; sin propiedad propia.
- [ ] Ejecutar en DB local y confirmar que fallan por RPC/tabla ausente antes de implementar.
- [ ] Implementar migración aditiva y tipos según spec; validación JSON cerrada, RLS y permisos mínimos; `effective_at` actualizado al editar/reactivar por servidor. Validar paginación/tamaño del lote.
- [ ] Agregar pruebas de dos identidades: nadie lee/edita intereses ajenos; RPC nunca acepta suplantación; dueño solo consulta demanda de propiedades propias; ninguna respuesta expone usuarios interesados.
- [ ] Repetir pruebas SQL en transacción con rollback y regenerar `src/types/database.generated.ts` desde DB local. Examinar `EXPLAIN` con fixture representativa y añadir solo índices justificados.
- [ ] Commit y PR de base de datos, sin accesos UI rotos. Migración por sí sola es aditiva.

## Fase 2 — quiz y gestión de intereses

**Interfaces:** `interestsService.list(): Promise<PropertyInterest[]>`, `save(id: string | null, filters: InterestFilters): Promise<PropertyInterest>`, `setActive(id: string, active: boolean): Promise<void>`, `remove(id: string): Promise<void>`. `InterestQuiz` recibe interés opcional y callbacks de guardado/cancelación.

- [ ] Preparar prueba funcional: una pregunta visible a la vez; volver conserva valores; omitir quita un grupo del cálculo; indispensable visible; tolerancias explícitas; cambiar casas a terrenos borra dormitorios/baños; cancelar no guarda.
- [ ] Implementar contratos/servicio y quiz con componentes existentes, título automático y resumen; persistencia solo al confirmar; impedir doble envío y mostrar errores recuperables.
- [ ] Implementar `/intereses` con edición, pausado/reactivación y eliminación confirmada. Añadir acceso en perfil.
- [ ] Verificar edición de un interés guardado, autorización y funcionamiento con teclado, móvil, claro/oscuro. Ejecutar `vitest run src/lib/__tests__/interestsService.test.ts` y `tsc --noEmit`.
- [ ] Commit y PR del quiz funcional sobre la base anterior; al pausar deja de contribuir a consultas del motor.

## Fase 3 — propiedades para ti y avisos internos

**Interfaces:** `interestsService.getMatches(page: number): Promise<InterestMatch[]>`, `getNewCount(): Promise<number>`, `markSeen(seenBefore: string): Promise<void>`. Prop opcional de card `match?: { score: number; interestLabel: string; reasons: MatchReason[] }`; los datos de propiedad se obtienen en lote conservando orden, nunca una consulta por card.

- [ ] Agregar pruebas: deduplicar propiedad coincidente con varios intereses y elegir mejor score; ordenar/paginar estable; distinguir ausencia de resultados de fallo; datos faltantes no aparecen como cumplidos.
- [ ] Implementar `/para-ti`, badges «X% de coincidencia», explicación accesible, selector opcional de interés y estados de carga/vacío/error. Si se agrega selector, debe filtrar mediante RPC antes de paginar, no solo las cards cargadas.
- [ ] Añadir consulta de contador una vez al establecer sesión y después de guardar intereses. Mantener likes/mensajes con su timestamp independiente. Integrar acceso «Propiedades para ti» en perfil/notificaciones/navegación sin modificar su funcionalidad existente.
- [ ] Probar novedades: publicaciones anteriores al interés no son nuevas; nuevas sí; cambiar/reactivar interés reinicia effective_at; abrir lista marca visto hasta inicio de lectura; una publicación posterior a ese instante continúa nueva; si falla lectura no marcar visto.
- [ ] Probar pausa/reactivación, regreso desde ficha, refresco y paginación con más de 20 coincidencias. Tipos y pruebas de servicios pasan; capturas móvil/escritorio en ambos temas.
- [ ] Commit y PR del listado y avisos. No usar copy que afirme correo enviado o notificación entregada.

## Fase 4 — demanda para quien publica y cierre integral

**Interfaces:** `interestsService.getOwnedDemand(propertyIds: string[]): Promise<PropertyDemand[]>`; contador y desglose calculados por usuario distinto, con mejor score elegible y umbral 31.

- [ ] Preparar pruebas de agregación: usuario con tres intereses cuenta uno; autor no cuenta; pausado/eliminado no cuenta; 100 separado de 31–99; cero visible como cero solo después de consulta exitosa.
- [ ] Integrar conteos en lote en publicaciones propias. Copy: «N personas tienen intereses compatibles»; explicación breve de que no son visitas ni contactos. Mostrar error/reintento sin fabricar cero.
- [ ] Prueba con dos cuentas: A crea interés; B completa todas las etapas y publica; antes de publicación no aparece ni genera aviso; después A ve score/razones y B cuenta una persona. A pausa su interés: desaparece de la demanda.
- [ ] Verificar edición de precio/ubicación, retirada y vencimiento: resultados/conteos cambian al leer; no avisos duplicados por editar en V1. Revisar privacidad de endpoints y acceso desde sesión ajena.
- [ ] Ejecutar suite existente, typecheck y lint si configuración del repo permite ejecutarlo; reportar cualquier bloqueo existente. Comprobar publicación, mapa, favoritos y notificaciones sin regresiones.
- [ ] Commit/PR final, aplicar migraciones antes de desplegar UI y levantar rama local para revisión. Incorporar docs de comportamiento y pruebas de aceptación.

## Revisión del plan

El flujo completo cubre quiz, múltiples matrices, umbral estricto, flexibilidad, porcentaje explicable, novedades sin cron, conteo anónimo y dos cuentas. Fase 1 concentra toda la lógica de matching; ninguna fase posterior crea otra fórmula. Fases 2–4 dependen de esa base, por lo que conviene ejecutarlas secuencialmente. Único dato externo pendiente para la fase 0: identidad/email de las cuentas; no bloquea revisión del diseño ni fases de producto.

Antes de comenzar código: revisar este plan y confirmar la propuesta de pesos y el canal interno. Este trabajo solo produce documentación; no cambia tablas ni producto.
