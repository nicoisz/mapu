# Plan de rediseño UI + animaciones — MapU

> **Estado 2026-06-10:** Fases A–F implementadas (tokens dark-first, acento #FF4D1C,
> Space Grotesk, hero nuevo con nav píldora/search/badge giratorio, PropertyCard
> rediseñada, skeletons, staggers, mapa dark nativo con pills monocromas y pinPop,
> precio destacado + CTA sticky en ficha, transiciones de ruta).
> Pendiente de la lista original: lightbox de galería, botones magnéticos,
> count-up de stats, filtros en píldoras, empty states ilustrados.

> Bullets accionables para implementar después. Sin código aún.
> Referencia visual aprobada por Nico: hero dark dramático estilo "Royal Property Group"
> (Dribbble): fondo casi negro, UN acento rojo-naranja eléctrico, tipografía display
> gigante, buscador flotante, badge circular giratorio.
> Fecha: 2026-06-10 · Complementa `docs/ANALISIS-MERCADO.md` (§5).

---

## 0. Corrección de rumbo (importante)

El análisis de mercado proponía "paleta neutra"; el feedback de Nico es que los
colores actuales son **muy pálidos y nada llama la atención**. Ambas cosas se
reconcilian así:

> **Simple ≠ pálido.** Pocos elementos, pero los que quedan con contraste brutal.
> Estructura minimalista + ejecución dramática (dark, foto cinematográfica,
> un acento eléctrico usado en máximo 3 lugares por pantalla).

---

## 1. Sistema de color (lo primero — todo lo demás depende de esto)

- [ ] **Dark-first.** El tema oscuro pasa a ser el principal (hoy es derivado).
      Fondos: `#0B0B0F` (base), `#15151A` (superficies), `#1D1D24` (elevadas).
- [ ] **Un acento eléctrico: rojo-naranja `#FF4D1C`** (como la referencia).
      Reglas de uso — SOLO en: (1) CTA principal de la pantalla, (2) precio o
      dato clave seleccionado, (3) elemento activo de navegación. Nada más.
- [ ] **Texto:** blanco roto `#F5F4F2` para titulares, gris `#9B9BA3` para
      secundario. Jamás gris sobre gris (problema actual: todo compite en tonos medios).
- [ ] **Light mode se conserva** pero con el mismo acento y contrastes altos
      (texto casi negro `#141414`, no grises lavados).
- [ ] Badges semánticos: venta = acento, arriendo = blanco con borde (no dos
      colores cálidos compitiendo como hoy).
- [ ] Revisar contraste WCAG AA del acento sobre dark (#FF4D1C sobre #0B0B0F pasa).

## 2. Tipografía

- [ ] Agregar una **fuente display** para titulares (candidatas: Clash Display,
      Space Grotesk, Archivo Expanded — vía next/font). Manrope queda para UI/cuerpo.
- [ ] Hero con titular **gigante en 2 líneas desfasadas** estilo referencia
      ("ENCUENTRA / TU LUGAR"), uppercase, con **franja de acento** detrás de
      una de las líneas.
- [ ] Precio en tarjetas y ficha: el dato más grande después del título — en
      blanco/negro, NO en color (el color es para el CTA).
- [ ] Escala tipográfica: display 64-96px / h2 32px / cuerpo 15px / meta 12px.

## 3. Landing (la pantalla que define la marca)

- [ ] **Hero full-bleed oscuro**: foto crepuscular de alta calidad (no picsum),
      overlay degradado a negro, titular display gigante + franja acento.
- [ ] **Buscador flotante tipo píldora oscura** sobre el hero (input + comuna +
      botón acento "Buscar"), reemplaza al hero search actual.
- [ ] **Badge circular giratorio** "Explorar propiedades ↗" (texto en círculo,
      rotación infinita lenta, CSS/GSAP) — firma visual de la referencia.
- [ ] **Nav minimal en píldora** flotante arriba (logo · 3 links · CTA acento),
      fondo translúcido con blur.
- [ ] Sección destacadas: tarjetas 70% foto sobre fondo oscuro, hover dramático.
- [ ] Stats con **count-up animado** al entrar en viewport (GSAP ya disponible).
- [ ] Eliminar: Ken Burns actual del carrusel (reemplazado por foto fija +
      parallax sutil), doble scrim, blobs decorativos con blur.

## 4. Animaciones (más y mejores — catálogo GSAP)

**Entrada / carga:**
- [ ] Timeline de hero: franja acento entra primero (scaleX 0→1), titular revela
      línea por línea (clip-path / y+opacity stagger), buscador sube al final.
- [ ] Stagger de tarjetas al cargar resultados (y: 24, opacity, 0.05s entre cada una).
- [ ] Skeleton shimmer mientras carga Supabase (hoy hay texto "Cargando…").

**Scroll (ScrollTrigger ya está en el proyecto):**
- [ ] Parallax sutil en imágenes de secciones (yPercent ±10).
- [ ] Reveals por sección ya existen → unificar curva (power3.out) y distancia.
- [ ] Header que se compacta al hacer scroll (height + blur animados).

**Hover / micro:**
- [ ] Tarjetas: lift (y: -6, sombra) + zoom de imagen 1.05 (ya existe el zoom — sumar lift).
- [ ] **Botón magnético** en CTAs principales (el botón sigue sutilmente al cursor).
- [ ] Corazón de favorito: pop con rebote (scale 1→1.3→1, elastic) al activar.
- [ ] Badge circular giratorio: rotación continua + invierte sentido en hover.

**Mapa:**
- [ ] Pop-in de pins con stagger al cargar clusters (scale 0→1, back.out).
- [ ] Cluster al hacer click: pulso antes del zoom (scale 1.15 rápido).
- [ ] Pills monocromas (blanco sobre dark map); seleccionada toma el acento + pop.
- [ ] Mantener: colapso de lista + tarjeta deslizante (ya implementados, funcionan).

**Transiciones de página:**
- [ ] Fade/slide corto entre rutas (template.tsx de Next + GSAP, 200-250ms).
- [ ] Respeto a `prefers-reduced-motion` en TODO lo anterior (patrón ya usado en buscar).

## 5. Buscar / Mapa

- [ ] Tema oscuro del mapa real: estilo de tiles dark (OpenFreeMap tiene
      `dark`/`fiord`) en vez del filtro CSS actual sobre positron.
- [ ] Fusionar count bar + sort en UNA línea limpia.
- [ ] Filtros: máximo 5 visibles en píldoras horizontales, resto en panel.
- [ ] Tarjeta de lista rediseñada: foto dominante, precio grande blanco,
      badge "Confirmado hace N días" (pilar frescura), verificación del vendedor.
- [ ] Empty state con ilustración/foto, no solo ícono gris.

## 6. Ficha de propiedad

- [ ] Galería protagonista: foto hero 60vh + tira de thumbnails, lightbox.
- [ ] Barra de contacto sticky (precio + CTA acento "Contactar") al hacer scroll.
- [ ] Datos duros en fila de 4 íconos grandes (dorm/baños/m²/estac.), resto colapsado.
- [ ] Badges de confianza arriba: verificado, dueño directo, confirmado hace N días.

## 7. Componentes transversales

- [ ] Navbar: píldora flotante translúcida con blur (referencia), activo en acento.
- [ ] Botones: primario = acento sólido; secundario = ghost blanco/negro con borde.
      Eliminar variantes intermedias que diluyen la jerarquía.
- [ ] Bordes: radius generoso (16-20px) consistente; eliminar rings/outlines dobles.
- [ ] Sombras: solo en elementos flotantes (tarjeta sobre mapa, navbar, modales).

## 8. Orden de implementación sugerido

| Fase | Qué | Impacto visual |
|---|---|---|
| **A** | Tokens de color dark-first + acento `#FF4D1C` + tipografía display | Cambia TODO el feel con poco código |
| **B** | Landing nueva (hero + buscador píldora + badge giratorio + timeline GSAP) | La primera impresión |
| **C** | PropertyCard rediseñada + skeletons + staggers | Se ve en todas las pantallas |
| **D** | Mapa dark + pills monocromas + animaciones de pins | Coherencia del producto core |
| **E** | Ficha de propiedad (galería + sticky CTA) | Conversión a contacto |
| **F** | Micro-interacciones restantes (magnético, transiciones de ruta, header compacto) | Pulido final |

Cada fase es desplegable por sí sola; A+B+C ya transforman la percepción del sitio.
