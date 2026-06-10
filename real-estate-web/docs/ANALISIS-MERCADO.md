# Análisis de mercado — Portales inmobiliarios en Chile

> Análisis competitivo + propuesta de diferenciador para MapU.
> Solo análisis, sin cambios de código. Fecha: 2026-06-10.

---

## 1. Mapa del mercado

| Portal | Posicionamiento | Fortalezas | Debilidades / flancos |
|---|---|---|---|
| **Portal Inmobiliario** (Mercado Libre) | Líder absoluto en tráfico y catálogo | Base de datos gigante, marca, todo rango de precios | Experiencia genérica de marketplace, saturado de avisos viejos, mala respuesta ante fraudes reportados |
| **TocToc** | El "moderno" del mercado, #3 en tráfico | UI cuidada, tasación online con datos del SII ($9.990/informe), simulador hipotecario, reserva online, subsidios | Orientado a proyectos/inmobiliarias; el particular es secundario; herramientas pro son de pago |
| **Houm** | Proptech corredora full-service (~10% del corretaje de arriendo) | Proceso 100% digital de punta a punta: visitas, contrato, garantía de pago; red de "Houmers" | No es un portal abierto: cobra 7–11,5% + IVA de comisión; el dueño pierde control |
| **Yapo.cl** | Clasificados generalistas con sección inmobiliaria | Gratis, masivo, trato directo con particulares | Cero verificación, diseño anticuado, foco difuso, terreno fértil para estafas |
| **Goplaceit** | Búsqueda map-first (pionero 2012) | Dibujar zonas en el mapa, alertas por zona guardada, ~80k propiedades | Innovación estancada; depende de profesionales (3.600 corredores), particular secundario |
| **Doomos** | Nicho "IA + tours VR" | Recomendaciones personalizadas, realidad virtual | Catálogo chico, poco tráfico |
| **Proppit** | B2B para corredores | CRM, analítica, marketing para profesionales | No es portal de consumo |
| **Urbani / Chilepropiedades / Emol** | Nichos (subsidios DS19/DS1, regiones, audiencia editorial) | Especialización | Alcance limitado |

### Lectura del tablero
- El **catálogo** ya tiene dueño (Portal Inmobiliario). Nadie le gana por volumen.
- La **modernidad UI** la reclama TocToc, pero su negocio real son las inmobiliarias y los proyectos nuevos, no el particular.
- El **servicio completo** lo tiene Houm, a cambio de una comisión alta.
- El **particular que publica gratis** queda atrapado entre Yapo (sin confianza, feo) y Portal Inmobiliario (se pierde entre miles de avisos de corredoras).

---

## 2. Dolores reales del mercado (no resueltos)

Investigando reclamos y guías anti-estafa chilenas, se repiten cuatro dolores:

1. **Desconfianza estructural**: estafas de arriendo (depósitos por propiedades inexistentes), corredores informales, avisos clonados. SERNAC ha llegado a recibir +5.000 reclamos del rubro en un año. Los portales grandes son lentos para bajar avisos fraudulentos reportados.
2. **Avisos zombi**: propiedades vendidas/arrendadas hace meses que siguen publicadas. El comprador asume lo peor ("¿por qué lleva 6 meses?") y el vendedor pierde poder de negociación.
3. **Contacto que no responde**: publicas un mensaje y nadie contesta; no hay señal de qué vendedores sí responden.
4. **Sobrecarga**: los líderes son densos — banners, avisos premium, filtros infinitos. Buscar casa es un trabajo de jornada completa.

**Ninguno de los grandes tiene incentivo para arreglar 1 y 2**: viven de volumen de avisos y de cobrar por destacar. Un aviso zombi sigue generando page views.

---

## 3. Dónde está MapU hoy (honesto)

**No puedes competir por catálogo, marca ni tráfico.** Pero el código actual ya apunta — sin habérselo propuesto — a los dolores de arriba:

| Dolor | Lo que MapU ya tiene |
|---|---|
| Avisos zombi | **Expiración automática a 30 días** + renovación explícita (ningún grande lo hace de cara al usuario) |
| Desconfianza | Esquema con verificaciones (email/teléfono/identidad), trigger de perfiles, diseño de reputación listo (`docs/TIPOS-DE-CUENTA.md`) |
| Contacto sin respuesta | Tablas `conversations`/`messages` (móvil) → permite medir y **mostrar** tasa/tiempo de respuesta |
| Sobrecarga | App pequeña: mapa con clustering + lista + ficha. Sin banners, sin ruido |

---

## 4. El diferenciador propuesto

### Posicionamiento
> **"El portal donde todo lo que ves está disponible y sabes con quién hablas."**
> Simple, fresco y sin trampas.

Tres pilares, en orden de prioridad:

### Pilar 1 — Frescura garantizada (el más barato, ya casi existe)
- Todo aviso expira a los 30 días salvo que el dueño confirme "sigue disponible" (1 clic desde un correo).
- Badge visible: **"Disponibilidad confirmada hace N días"**. El filtro implícito: aquí no hay avisos zombi.
- Métrica de marca: "edad promedio del aviso en MapU vs. el resto".
- Costo: bajísimo — la expiración ya está implementada; falta el correo de confirmación y el badge.

### Pilar 2 — Confianza verificable
- Badges de verificación escalonados (email → teléfono → identidad → licencia/RUT).
- "Dueño directo" como categoría de primera clase (lo que Yapo insinúa pero nunca garantiza).
- Tasa y tiempo de respuesta **públicos** en cada vendedor ("responde en ~1 h, 95%").
- Después: ratings y reseñas con prueba de contacto (diseñado en `TIPOS-DE-CUENTA.md`).
- Reporte de aviso con SLA visible ("los reportes se revisan en <24 h") — exactamente donde Portal Inmobiliario falla.

### Pilar 3 — Simplicidad radical (tu intuición de diseño, elevada a estrategia)
No es solo estética: es la promesa de producto. "Encuentra en 3 minutos lo que en otros portales toma 30".
- Una sola vista principal: **mapa + lista** (ya la tienes). La búsqueda por texto entiende lenguaje natural ("casa 3d ñuñoa" ya funciona en tu `searchService`).
- Máximo 5 filtros visibles; el resto detrás de "más filtros".
- Ficha de propiedad: foto grande, precio, 4 datos duros, contacto. Todo lo demás colapsado.
- Cero banners, cero avisos "destacados" que contaminen el orden de resultados (si se monetiza destacar, que sea marcado y discreto).

### Por qué esta combinación es defendible
- A Portal Inmobiliario le es **estructuralmente caro** copiarla: limpiar avisos zombi reduce su inventario aparente y sus métricas de venta a corredoras.
- TocToc podría copiar la estética, pero su cliente es la inmobiliaria, no el particular: no va a publicar tasas de respuesta de sus clientes que pagan.
- Houm resuelve confianza cobrando 7–11%: MapU la resuelve **gratis con transparencia**.
- Goplaceit tiene el mapa, pero no la capa de confianza ni la frescura.

### El tagline candidato
- "MapU — propiedades disponibles, personas verificadas."
- "Sin avisos fantasma."
- "Encuentra de verdad."

---

## 5. Dirección de diseño (simple, moderno, mejores colores)

Diagnóstico rápido del estado actual: la base es buena (Manrope, dark mode, Material-ish tokens, pills de precio en el mapa), pero hay síntomas de "demo": tarjetas con muchos bordes/sombras, barras de estado densas (count bar + stats bar), gradientes y blurs decorativos en headers, y una paleta cálida que tiende a sentirse pesada.

Dirección propuesta (inspiración: TocToc por limpieza, Airbnb/Idealista por jerarquía de fotos):

1. **La foto es la interfaz.** Tarjetas con imagen 70% del área, texto mínimo encima/debajo. Quitar bordes y ring; usar espacio en blanco como separador.
2. **Una paleta neutra + un acento.** Base casi monocroma (fondos `#FAFAF8`/`#111` dark, texto gris cálido) y **un solo color de acento** para precio/CTAs. Candidato: un verde confianza (≈ `#0E7C66`) o el coral actual pero usado 10 veces menos. El acento debe significar algo: "disponible/verificado".
3. **Tipografía con jerarquía real:** precio grande y en negro (no en color), título secundario, metadatos en gris. Hoy el precio compite en color con badges y botones.
4. **Densidad: aire.** Duplicar padding en tarjetas y ficha; eliminar la doble barra (count + stats) fusionándola en una línea.
5. **El mapa como protagonista** (ya lo es): pills de precio monocromas (blanco/negro) y solo la seleccionada toma el acento — hoy todas compiten en color.
6. **Microinteracciones sobrias:** las animaciones GSAP actuales (colapso de lista, tarjeta flotante) van en la dirección correcta; evitar agregar más movimiento decorativo (Ken Burns del hero es prescindible).
7. **Identidad "fresca":** el badge "Confirmado hace N días" como elemento visual distintivo y repetido — que el usuario lo asocie a la marca.

> Regla de oro para cada pantalla: si un elemento no ayuda a decidir "¿contacto o sigo buscando?", se colapsa o se elimina.

---

## 6. Qué NO hacer (por ahora)

- ❌ Competir en catálogo o SEO de volumen contra Portal Inmobiliario.
- ❌ Tasación pagada estilo TocToc (requiere data de transacciones que no tienes).
- ❌ Full-service estilo Houm (operación física, capital intensivo).
- ❌ Tours VR / IA generativa como bandera (Doomos lo intenta sin tracción; es feature, no estrategia).
- ❌ Monetizar con banners o destacados que rompan el orden de resultados (mata el Pilar 3).

---

## 7. Próximos pasos medibles (cuando decidas ejecutar)

1. **Pilar 1 (frescura):** correo "¿sigue disponible?" al día 25 + badge en ficha/tarjeta. _Métrica: % de avisos confirmados <7 días._
2. **Rediseño visual** según §5, empezando por PropertyCard y la ficha (las dos superficies que más se ven). _Métrica: tasa de contacto por visita a ficha._
3. **Pilar 2 fase 1:** badges de verificación + "Dueño directo" (campos ya existen). _Métrica: % de avisos con vendedor verificado._
4. Tasa de respuesta pública cuando exista mensajería web (tablas ya están).

---

## Fuentes

- [Urbani — Los 10 mejores portales inmobiliarios en Chile 2026](https://urbani.cl/10-mejores-portales-inmobiliarios-en-chile/)
- [Similarweb — Competidores de portalinmobiliario.com](https://www.similarweb.com/es/website/portalinmobiliario.com/competitors/)
- [TocToc — Tasador de propiedades online](https://www.toctoc.com/tasador-propiedades/)
- [La Tercera — Houm apunta a ganar dinero en 2026](https://www.latercera.com/pulso/noticia/la-promesa-de-la-mayor-corredora-inmobiliaria-online-de-chile-houm-apunta-a-ganar-dinero-en-2026/SNH3CUP76VDSFGJNKFGSE2XSZA/)
- [Houm — Servicios de corretaje y planes](https://houm.com/cl/propietario/servicio-de-corretaje)
- [Goplaceit — búsqueda por zonas en el mapa](https://www.goplaceit.com/cl/)
- [Reclamos.cl — Portal Inmobiliario, publicación de fraude](https://www.reclamos.cl/inmobiliaria/reclamo/2019/may/portal_inmobiliario_publicacion_de_fraude)
- [SERNAC — derechos en el mercado inmobiliario](https://www.sernac.cl/recomendaciones-al-comprar-una-vivienda-sernac-recuerda-tus-derechos-en-el-mercado-inmobiliario/)
- [Estudio Camus — Estafas inmobiliarias en Chile](https://estudiocamus.cl/abogados-compraventa/estafas-inmobiliarias/)
- [Blog Trovit — Guía para analizar anuncios inmobiliarios en Chile](https://blog.trovit.cl/consejos/guia-analizar-anuncios-inmobiliarios-chile)
