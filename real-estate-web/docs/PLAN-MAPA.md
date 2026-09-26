# Plan de mapa — MapU

> Plan de implementación por fases. **Cada fase = 1 PR.**
> Basado en el análisis de estética y funcionalidad del mapa (2026-09-25) y en el
> código actual (`MapView.tsx`, `priceZones.ts`, `/buscar`, `/mapa`).
> Complementa `docs/ANALISIS-MERCADO.md` (§4–5) y `docs/REDISENO-UI.md` (§5).
> Fecha: 2026-09-25.

**Objetivo:** que el mapa deje de ser un visor de inventario y pase a ser la
herramienta con la que el usuario decide **dónde quiere vivir** — intuitivo,
liviano y con información que de verdad cambia una decisión.

---

## Restricciones globales

- Cada fase entra como **un PR independiente y desplegable**. Si un PR necesita otro sin mergear, están mal cortados.
- Cada PR pasa `npm run lint`, `npm run typecheck`, `npm run test`, `npm run format:check` y `npm run build`.
- Migraciones en `supabase/migrations/` (idempotentes), aplicadas por el workflow `deploy-migrations`.
- Toda capa de datos nueva entra con **import dinámico**; ningún PR sube el bundle del mapa sin medirlo.
- **Ninguna capa se enciende por defecto.** El estado inicial del mapa es el más silencioso posible.
- **Un solo dato codificado en color a la vez.** Si hay capa de análisis activa, los pines van en gris.
- Nada que afirme valor futuro. Todo dato se muestra con **fuente, período y n**.
- Todo lo visual respeta `prefers-reduced-motion` (patrón ya usado en `/buscar`).

## Flujo de ramas y despliegue

**Todos los PRs van contra `main`** (trunk-based), igual que el flujo actual
(`hardening/task-01-publish` → PR → `main`). Rama por PR, nombrada
`feat/mapa-NN-slug` / `fix/mapa-NN-slug`.

**Consecuencia a tener presente:** en este repo, mergear a `main` es desplegar.

- `deploy.yml` → push a `main` que toque `real-estate-web/**` despliega a Cloudflare **producción**.
- `deploy-migrations.yml` → push a `main` que toque `supabase/migrations/**` corre `supabase db push --linked` contra la **base de producción**.
- No hay staging.

Reglas que hacen que eso sea seguro:

- **Feature flags** (`src/lib/flags.ts`, leídos de env) para toda fase que necesite
  más de un PR antes de ser usable: Contexto (15–18), Mis lugares (19–20) y Valor
  (21–24). Entran a `main` apagadas y se encienden cuando la fase está completa.
  Sin ramas de integración largas.
- **Secuencial dentro de una fase, paralelo solo entre fases que no comparten archivos.**
  Los PRs 5–8 tocan todos `MapView.tsx`: en paralelo son conflictos garantizados.
  El PR 15 (ingesta de POIs) sí puede ir en paralelo a la Fase 1.
- **Migraciones aditivas y separadas del código que las usa.** Un PR crea la tabla
  o la columna (nullable); el siguiente la consume. Nada de `DROP`/`RENAME` junto
  al código que depende del cambio.
- **Un PR nunca deja la app en un estado intermedio visible.** Si no se puede
  cumplir, va detrás de un flag.

Pendientes de infraestructura, antes de empezar la Fase 1:

- [ ] **Proteger `main`**: requerir PR y CI en verde (hoy la rama no tiene protección, el CI es solo informativo).
- [ ] **Preview deployment por PR** en Cloudflare (`wrangler versions upload`). La Fase 1 es puramente visual y necesita revisarse en el navegador, no en el diff.
- [ ] `src/lib/flags.ts` + variables en el environment `env` de GitHub.

## Resumen

| PR | Título | Tamaño | Depende de |
|---|---|---|---|
| 1 | Geocodificación real en `/publicar` | M (2d) | — |
| 2 | Moneda: UF/CLP correctas en mapa y zonas | S (1d) | — |
| 3 | Bugs de vista del mapa | S (0.5d) | — |
| 4 | Snapshot mensual de UF/m² por celda | S (1d) | 2 |
| 5 | Sistema de pines monocromo | M (1.5d) | 2 |
| 6 | Basemap propio MapU | M (2d) | — |
| 7 | Chrome unificado del mapa | M (1.5d) | 5, 6 |
| 8 | Jerarquía por zoom (densidad → clusters → precios) | M (2d) | 5 |
| 9 | Unificar `/mapa` y `/buscar` | L (3d) | 7 |
| 10 | Estado del mapa en la URL + "Buscar en esta zona" | M (1.5d) | 9 |
| 11 | Hover sync lista↔mapa + bottom sheet móvil | M (2d) | 9 |
| 12 | Filtros en chips | M (1.5d) | 9 |
| 13 | "Precio vs. su sector" | M (2d) | 2 |
| 14 | Badge de frescura en el mapa | S (1d) | 5 |
| 15 | Ingesta de POIs (OSM + MINEDUC + DEIS) | L (4d) | — |
| 16 | Servicio de ruteo a pie + caché | M (2d) | 15 |
| 17 | Capa Contexto (UI) | M (2.5d) | 15, 16, 7 |
| 18 | Entorno como filtro de búsqueda | M (2d) | 17 |
| 19 | "Mis lugares" — anclas + isocrona visual | L (4d) | 16, 7 |
| 20 | Isocrona como filtro + búsquedas guardadas | L (3d) | 19 |
| 21 | Superficie UF/m² honesta | M (2.5d) | 4, 13 |
| 22 | Variación de valor con datos SII | L (4d) | 21 |
| 23 | Capa "sector en movimiento" (permisos INE) | M (2.5d) | 21 |
| 24 | Filtro de oportunidad combinado | M (2d) | 21, 22 |
| P1 | Clustering server-side (condicional) | L (4d) | 9 |

---

## FASE 0 — Datos correctos (bloqueante)

Sin esto, todo lo demás pinta datos falsos con mucha confianza.

### PR 1 — `fix(publicar): geocodificación real de direcciones`

**Problema:** la dirección no se convierte a lat/lng; todo aviso cae en el centro
de Santiago (`DEFAULT_MAP_CENTER`). El mapa es ficción.

**Alcance**

- `src/services/geocodingService.ts`: implementar contra Nominatim (respetar `GEOCODING_MIN_INTERVAL_MS`), con `NEXT_PUBLIC_GEOCODING_URL` como override.
- `src/app/publicar/page.tsx`: geocodificar al salir del campo dirección, mostrar el resultado en `LocationPicker` y **permitir corregir el pin arrastrándolo**.
- `src/app/api/publish/route.ts`: rechazar publicación sin coordenadas válidas dentro de Chile.
- `scripts/backfill-geocode.ts`: re-geocodificar los avisos existentes con coordenadas por defecto.

**Tareas**

- [ ] Implementar `geocode(address)` con throttling y manejo de errores
- [ ] Integrar en `/publicar` con confirmación visual del pin
- [ ] Validación server-side de bounds de Chile en `/api/publish`
- [ ] Script de backfill + ejecución sobre el seed demo
- [ ] Tests de `geocodingService` (mock de respuestas)

**Aceptación:** publicar una dirección de Valdivia deja el pin en Valdivia; ningún aviso nuevo queda en el centro de Santiago; el backfill reporta cuántos corrigió.

---

### PR 2 — `fix(map): moneda correcta en pines y zonas de precio`

**Problema:** `formatPriceShort` antepone `$` y abrevia a miles en cualquier
moneda → un aviso de UF 4.483 se muestra como `$4k`. Y `computePriceZones` suma
UF con CLP en el mismo promedio, así que los terciles no significan nada.

**Alcance**

- `src/lib/utils.ts`: formateo por moneda (venta en UF, arriendo en `$/mes`).
- `src/lib/uf.ts` (nuevo): valor UF del día con caché; extraer la lógica que hoy vive en `ExchangeIndicators.tsx`.
- `src/lib/priceZones.ts`: normalizar todo a UF antes de agregar; filtrar por operación de verdad (hoy una propiedad en venta contamina el modo arriendo vía fallback).
- `src/components/layout/ExchangeIndicators.tsx`: consumir `lib/uf.ts`.

**Tareas**

- [ ] `formatPriceShort` / `getMapPinPrice` por moneda + tests
- [ ] `lib/uf.ts` con caché y fallback si la API falla
- [ ] Normalización a UF en `computePriceZones` + filtro por operación
- [ ] Leyenda muestra la moneda real, no CLP fijo
- [ ] Tests de `priceZones` con dataset mixto UF/CLP

**Aceptación:** un aviso de UF 4.483 muestra `UF 4.483`; un arriendo muestra `$650k/mes`; los buckets de zona no cambian al convertir un aviso de CLP a UF con el mismo valor real.

---

### PR 3 — `fix(map): bugs de vista`

**Alcance**

- `MapView.tsx`: `fitToken` debe encuadrar **los resultados visibles**, no la constante `LIST_VIEW_CENTER` (hoy "Ver lista" teletransporta el mapa a un punto fijo cerca de Talagante).
- `MapView.tsx`: eliminar la animación elástica del hexágono — clona toda la `FeatureCollection` con `JSON.parse(JSON.stringify(...))` en cada frame.
- `src/app/mapa/page.tsx`: pasar `onBoundsChange` para que la lista filtre por viewport igual que `/buscar`.
- `src/constants/index.ts`: eliminar `LIST_VIEW_CENTER` / `LIST_VIEW_RADIUS_KM`.
- Zonas de precio **apagadas por defecto** (`zonesOn = false`) hasta el PR 21.

**Aceptación:** apretar "Lista" mantiene la zona que el usuario estaba mirando; no hay `requestAnimationFrame` clonando geometría; `/mapa` y `/buscar` filtran igual.

---

### PR 4 — `chore(data): snapshot mensual de UF/m² por celda`

**Invisible para el usuario. Hacerlo temprano: su valor crece con el tiempo.**
Es la única fuente de plusvalía que nadie puede copiar, porque es tu inventario.

**Alcance**

- `supabase/migrations/*_price_cells.sql`: tabla `price_cell_snapshots` (`cell_id`, centro, `period`, `operation`, `uf_per_m2_mean`, `uf_per_m2_median`, `n`, `created_at`).
- `scripts/snapshot-price-cells.ts`: agrega los avisos activos por celda y escribe el período.
- `.github/workflows/`: cron mensual.

**Aceptación:** correr el script dos veces en el mismo período es idempotente; con el seed demo genera filas con `n` correcto.

---

## FASE 1 — Sistema visual

### PR 5 — `feat(map): sistema de pines monocromo`

**Problema:** hoy cada aviso en venta es `#FF4D1C`. Con 200 pines el acento
aparece 200 veces y deja de significar algo — lo contrario de lo que pide
`REDISENO-UI.md` §4.

**Alcance**

- `MapView.tsx` → extraer la construcción de pines a `src/components/map/pins.ts`.
- Pin por defecto: superficie clara, texto `on-surface`, borde hairline.
- Acento reservado a tres estados: **seleccionado**, **favorito**, **hover**.
- Estado **"ya vista"**: opacidad reducida, persistido en `localStorage` (`STORAGE_KEYS`).
- Venta/arriendo se distingue por sufijo (`/mes`), no por color de relleno.
- Clusters monocromos coherentes con el nuevo pin.
- Quitar el rombo de zona dentro del pin.

**Aceptación:** en una búsqueda con 200 resultados el acento aparece como máximo 3 veces; volver a una búsqueda muestra atenuadas las ya visitadas.

---

### PR 6 — `feat(map): basemap propio MapU`

**El mayor salto visual de todo el plan.** Es lo que hace que el mapa se vea
diseñado y no embebido.

**Alcance**

- `public/map-styles/mapu-light.json` y `mapu-dark.json`: fork de positron/dark (Maputnik).
- Suelo del mapa = color de fondo de la app (`--background`), para que mapa y UI sean una sola superficie.
- POIs comerciales y logos de marca **apagados**; agua en teal desaturado de la paleta; parques en verde-gris cálido; vías principales conservadas.
- `MapView.tsx` / `MiniMapInner.tsx` apuntan al estilo local en vez de a `tiles.openfreemap.org/styles/*`.
- Satélite/híbrido: ajustar contraste de pines sobre imagen (hoy se fuerza `isDark = false` y los clusters blancos se pierden).

**Aceptación:** no aparece ningún logo comercial en el basemap; el borde entre mapa y panel deja de notarse en ambos temas.

---

### PR 7 — `refactor(map): chrome unificado`

**Alcance**

- Fusionar la barra de búsqueda y la de stats de `/mapa` en una sola línea.
- De 4 grupos flotantes a 2: **arriba-izquierda** chips de capas, **abajo-derecha** controles (zoom, capa base, mi ubicación).
- Leyenda: de tarjeta siempre abierta de 224px a chip colapsado que se expande.
- `src/components/map/MapChrome.tsx` (nuevo) concentra los controles.
- Reemplazar los emoji de `SearchBar` (📍🏠🕐🔥) por íconos `lucide-react`.

**Aceptación:** el mapa muestra como máximo 2 grupos de controles; el área útil de mapa crece medible respecto de hoy.

---

### PR 8 — `feat(map): jerarquía por zoom`

**Alcance**

- z < 11 → capa de densidad (heatmap nativo de MapLibre).
- z 11–13 → clusters.
- z ≥ 14 → píldoras de precio.
- Transiciones sin parpadeo al cruzar umbrales.

**Aceptación:** una búsqueda a nivel país no muestra cientos de etiquetas apiladas; acercarse revela precios progresivamente.

---

## FASE 2 — Una sola pantalla, más fácil de usar

### PR 9 — `refactor(search): unificar /mapa y /buscar`

**Problema:** dos implementaciones de la misma pantalla, con capacidades
distintas (bounds, sort y paginación solo en `/buscar`).

**Alcance:** `/buscar` queda como única pantalla; `/mapa` redirige permanente.
Mover lo rescatable de `mapa/page.tsx`. Actualizar `sitemap.ts` y enlaces internos.

**Aceptación:** `/mapa` redirige 308; no queda código duplicado de mapa.

---

### PR 10 — `feat(search): estado del mapa en la URL + buscar en esta zona`

**Alcance**

- `src/lib/mapState.ts`: serializar bbox + zoom + filtros a query params.
- Botón **"Buscar en esta zona"** al mover el mapa (hoy solo se refiltra el resultado ya cargado).
- Restaurar la vista al entrar con URL.

**Aceptación:** copiar la URL y abrirla en otra pestaña reproduce la misma vista; el botón atrás recorre las vistas.

---

### PR 11 — `feat(search): hover sync + bottom sheet móvil`

**Alcance:** hover en tarjeta resalta su pin y viceversa; en móvil, bottom sheet
arrastrable (3 alturas) en vez del FAB que alterna vistas.

**Aceptación:** el pin resaltado es evidente sin hacer clic; en móvil se puede ver mapa y lista a la vez.

---

### PR 12 — `feat(search): filtros en chips`

**Alcance:** 5 chips horizontales (operación, tipo, precio, dormitorios, superficie)
con estado visible; el resto detrás de "Más filtros". `FilterPanel.tsx` pasa a ser
el panel secundario.

**Aceptación:** los filtros más usados se aplican sin abrir modal; el chip activo muestra su valor, no solo un contador.

---

## FASE 3 — Información práctica

### PR 13 — `feat(property): precio vs. su sector`

**Alto valor, datos que ya existen.**

**Alcance:** calcular el UF/m² mediano del sector y comparar; mostrar
_"12% bajo el promedio de Isla Teja"_ en `PropertyCard` (modo detalle) y
`PropertyDetail`. Requiere `n` mínimo; si no hay datos, no se muestra nada.

**Aceptación:** con menos de N avisos en el sector el bloque no aparece; el porcentaje es reproducible desde los datos.

---

### PR 14 — `feat(map): badge de frescura`

**Tu pilar 1 hoy es invisible en el mapa.**

**Alcance:** indicador en el pin y línea en la tarjeta con _"Confirmado hace N días"_;
filtro "solo confirmadas esta semana". Usa `expiresAt` / `LISTING_EXPIRATION_DAYS` ya existentes.

**Aceptación:** se puede filtrar el mapa por frescura; el badge aparece en tarjeta, pin y ficha.

---

## FASE 4 — Contexto (el entorno, bien hecho)

### PR 15 — `feat(data): ingesta de POIs`

**Alcance**

- `supabase/migrations/*_pois.sql`: tabla `pois` (`category`, `name`, lat/lng, `source`, `source_id`, `attrs jsonb`), índice espacial.
- `scripts/ingest-pois.ts`: Overpass/OSM (paraderos, parques, comercio), **MINEDUC** (RBD, dependencia, matrícula), **DEIS/MINSAL** (centros de salud).
- Re-ejecutable e idempotente por `(source, source_id)`.

**Aceptación:** ingesta de Valdivia y una comuna de Santiago con conteos por categoría; correrlo dos veces no duplica.

---

### PR 16 — `feat(data): ruteo a pie + caché`

**Alcance:** `src/services/routingService.ts` contra OSRM/ORS; caché por celda de
origen; **tiempos reales por la red de calles, nunca euclidianos**; job que
precalcula los POIs cercanos al publicar y los guarda en un `jsonb` de la propiedad.

**Aceptación:** dos puntos separados por un río dan un tiempo coherente con el puente; el render de la ficha no hace llamadas de ruteo.

---

### PR 17 — `feat(map): capa Contexto`

**Alcance**

- Chips: Transporte · Colegios · Salud · Áreas verdes · Comercio.
- **Apagados por defecto, una sola activa a la vez.**
- Con capa activa: basemap desaturado, pines de precio en gris, POIs en un color con glifo.
- Nombres completos y tiempos: _"Escuela España · 6 min"_, _"Paradero Carampangue · líneas 1, 2, 3, 11 · 2 min"_.
- Reemplaza el bloque de entorno de la ficha: mapa + lista sincronizados, arriba del fold.

**Aceptación:** nunca hay dos categorías activas; ningún ítem aparece sin nombre; los minutos vienen del ruteo.

---

### PR 18 — `feat(search): entorno como filtro`

**El moat.** Portal Inmobiliario tiene una lista decorativa; acá el entorno filtra.

**Alcance:** filtros tipo _"con colegio a menos de 5 min"_, _"paradero a menos de
3 min"_, resueltos en SQL sobre lo precalculado en el PR 16.

**Aceptación:** el filtro cambia el conteo de resultados y se refleja en la URL.

---

## FASE 5 — Mis lugares (el diferenciador)

### PR 19 — `feat(map): anclas + isocrona visual`

**Alcance**

- El usuario marca 1–3 anclas ("mi pega", "el colegio") por búsqueda o clic en el mapa.
- `src/services/isochroneService.ts` con caché agresivo por (celda, modo, minutos).
- Modos: a pie / auto. Transporte público queda para después (GTFS).
- **Visual: se oscurece lo que queda fuera**, no se pinta lo de adentro.

**Aceptación:** con un ancla y 15 min a pie, la forma respeta ríos y calles; cambiar de 15 a 30 min no vuelve a llamar la API si ya se calculó.

---

### PR 20 — `feat(search): isocrona como filtro + búsquedas guardadas`

**Alcance:** los resultados se recortan a la isocrona; guardar la búsqueda **con
sus anclas** ("Mi búsqueda cerca del colegio"); base para alertas por zona
(`price_alerts` ya existe en el esquema).

**Aceptación:** una búsqueda guardada restaura anclas, modo, minutos y filtros.

---

## FASE 6 — Valor y plusvalía

> Regla de esta fase: **plusvalía ≠ nivel de precio**. Nada se etiqueta como
> plusvalía hasta tener dos momentos en el tiempo.

### PR 21 — `feat(map): superficie UF/m² honesta`

**Alcance:** reemplaza el coropleto actual. Agregación por **UF/m²** (no precio
absoluto), celdas de barrio de 400–600 m o unidad vecinal, `n` mínimo por celda,
**sin color donde no hay dato**, rampa **secuencial de un tono**, opacidad 0.25–0.3,
**capa insertada debajo de los símbolos** (`addLayer(capa, idPrimeraCapaDeSímbolos)`),
sin borde blanco. Tooltip con valor, `n`, período y fuente. Nombre: "UF/m² por sector".

**Aceptación:** las calles y nombres del basemap siguen legibles con la capa activa; un sector sin datos suficientes se ve vacío y lo dice.

---

### PR 22 — `feat(data): variación de valor con datos SII`

**Alcance:** ingesta de avalúos / mapas de valores de terreno del SII; cálculo de
variación entre reavalúos, **en UF**; escala **divergente** anclada al promedio
comunal (teal ↔ neutro ↔ terracota); leyenda con la escala real y marca del sector
observado; fuente y período siempre visibles. Nunca proyecciones.

> Antes de comprometer este PR: verificar formato de descarga, cobertura y licencia
> de los datos del SII, y el estado del ciclo de reavalúo vigente.

**Aceptación:** cada celda muestra fuente y período; ningún texto afirma valor futuro.

---

### PR 23 — `feat(map): sector en movimiento`

**Alcance:** permisos de edificación (INE, mensual por comuna) y obras de transporte
confirmadas como **indicador adelantado**; capa aparte, fraseada como hecho
(_"3× más permisos que hace dos años"_), no como pronóstico.

---

### PR 24 — `feat(search): filtro de oportunidad`

**La tesis de inversión en un clic, y nadie se la da gratis al particular:**
_"propiedades bajo el precio promedio de su sector, en sectores que suben más que
la comuna"_.

**Aceptación:** el filtro combina PR 13 y PR 21/22 y explica en una línea qué está haciendo.

---

## Vía paralela — módulos de producto (no bloquean el mapa)

Pendientes de `TODO.md`, en orden de impacto. Un PR cada uno:

- [ ] Editar una propiedad publicada (el service existe, falta la página) — S
- [ ] Paginación real en resultados — S
- [ ] Compartir (`shareService` es un stub) — S
- [ ] Lightbox de galería en la ficha — S
- [ ] Calculadora hipotecaria — M
- [ ] Agendar visita — M
- [ ] Comparador de propiedades — M
- [ ] Búsquedas guardadas y alertas (`price_alerts`) — M _(se apoya en PR 20)_
- [ ] Mensajería real (`conversations`/`messages`) → habilita **tasa de respuesta pública** — L
- [ ] Verificación escalonada + "Dueño directo" — M
- [ ] Premium/pagos con Mercado Pago (`payments`) — L
- [ ] Tests y E2E del mapa (hoy: cero) — continuo

### PR P1 (condicional) — `perf(map): clustering server-side`

**Disparador:** superar ~1.500 avisos activos o notar jank al panear.
Hoy `MAX_QUERY_RESULTS = 1000` baja al cliente y se clusteriza en el browser.
Mover a PostGIS + endpoint de tiles/clusters. Hacerlo **antes** de que las capas
de contexto y valor sumen peso.

---

## Cómo medir que funcionó

- **Intuición:** tiempo hasta el primer clic en un pin, y % de sesiones que usan el mapa vs. solo la lista.
- **Facilidad:** % de búsquedas que aplican al menos un filtro desde los chips (sin abrir el modal).
- **Utilidad:** % de fichas abiertas desde un resultado filtrado por entorno o isocrona.
- **Diferenciación:** % de búsquedas guardadas con anclas — si nadie las guarda, la tesis está mal.
- **Contacto:** tasa de contacto por visita a ficha, antes y después de la Fase 3.
