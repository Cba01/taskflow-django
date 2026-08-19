---
name: TaskFlow
description: Task manager de plastilina colorida — cada color tiene un trabajo fijo, nada es "el color de la marca"
colors:
  clay-coral: "#FB923C"
  clay-coral-soft: "#FFEDD5"
  clay-coral-text: "#9A3412"
  clay-sky: "#38BDF8"
  clay-sky-soft: "#E0F2FE"
  clay-sky-text: "#075985"
  clay-mint: "#34D399"
  clay-mint-soft: "#D1FAE5"
  clay-mint-text: "#065F46"
  clay-violet: "#A78BFA"
  clay-violet-soft: "#EDE9FE"
  clay-violet-text: "#5B21B6"
  clay-sunshine: "#FBBF24"
  clay-sunshine-soft: "#FEF3C7"
  clay-sunshine-text: "#92400E"
  clay-rose: "#FB7185"
  clay-rose-soft: "#FFE4E6"
  clay-rose-text: "#9F1239"
  clay-stone: "#94A3B8"
  clay-stone-soft: "#F1F5F9"
  clay-stone-text: "#334155"
  canvas: "#FBF9F5"
  surface: "#FFFFFF"
  ink-heading: "#0F172A"
  ink-body: "#1E293B"
  ink-muted: "#64748B"
  ink-faint: "#94A3B8"
  border-field: "#E2E8F0"
typography:
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  heading:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.125rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
rounded:
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "22px"
  pill: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "24px"
components:
  button-create:
    backgroundColor: "{colors.clay-sunshine-soft}"
    textColor: "{colors.clay-sunshine-text}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-neutral:
    backgroundColor: "{colors.clay-stone-soft}"
    textColor: "{colors.clay-stone-text}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.xl}"
    padding: "20px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
---

# Design System: TaskFlow

## Overview

**Creative North Star: "El Cajón de Juguetes"**

TaskFlow se ve como un cajón de fichas de plastilina de colores: cada ficha tiene un trabajo fijo — crear es ámbar, guardar es menta, eliminar es coral/rosa, editar es celeste, todo lo que toca a personas es violeta — y no hay ninguna ficha "principal" que domine el resto. La marca no vive en un solo color; vive en la forma (bordes gruesos, esquinas muy redondeadas, sombra doble que se hunde al tocarla) y en cómo se reparte el color por función.

Es juguetón pero profesional: colorido y con rebote, pensado para que se sienta divertido de usar sin dejar de leer como una herramienta de trabajo seria (el público real son reclutadores evaluando el código como pieza de portfolio). Rechaza explícitamente dos referencias: el flat minimalista gris/índigo con el que arrancó el proyecto (Dashboard original, ya reemplazado por completo), y el neobrutalismo de sombras duras sin blur — la sombra acá siempre es suave y de dos capas, nunca un bloque `4px 4px 0`.

**Key Characteristics:**
- Sin color primario: el color codifica acción/categoría, no marca.
- Bordes gruesos (2–3px) y esquinas muy redondeadas (12–26px) en todo lo tocable.
- Sombra doble "de plastilina": luz arriba-izquierda + sombra teñida del propio color abajo-derecha.
- Todo lo interactivo responde: sube y crece un poco al pasar el mouse, se hunde al presionar.
- Controles del navegador (select, confirm) reemplazados por versiones propias — nada de UI nativa sin estilizar.

## Colors

Paleta de 7 huellas de color con roles fijos, más una base neutra cálida (no gris puro) para el fondo y el texto.

### Acentos por rol (sin color primario)
- **Coral** (`#FB923C` / tinte `#FFEDD5` / texto `#9A3412`): prioridad alta, junto con rose.
- **Sky** (`#38BDF8` / tinte `#E0F2FE` / texto `#075985`): editar, estado "Pendiente".
- **Mint** (`#34D399` / tinte `#D1FAE5` / texto `#065F46`): guardar/confirmar, estado "Completada", prioridad baja.
- **Violet** (`#A78BFA` / tinte `#EDE9FE` / texto `#5B21B6`): personas — auth, roles admin, "Gestionar miembros", paginación siguiente.
- **Sunshine** (`#FBBF24` / tinte `#FEF3C7` / texto `#92400E`): crear (proyecto, tarea, comentario, cuenta), estado "En progreso".
- **Rose** (`#FB7185` / tinte `#FFE4E6` / texto `#9F1239`): eliminar/destructivo, prioridad alta, notificaciones sin leer.
- **Stone** (`#94A3B8` / tinte `#F1F5F9` / texto `#334155`): chrome neutral — cancelar, filtros, rol "member", paginación anterior.

### Neutral
- **Superficie** `#FFFFFF`: fondo de tarjetas, paneles y modales.
- **Lienzo** `#FBF9F5` con lavados radiales de coral/sunshine/mint/violet al 14–16% de opacidad en las cuatro esquinas: el "aire" de fondo detrás de cada página, nunca gris plano.
- **Texto**: `slate-900` (encabezados), `slate-800` (cuerpo), `slate-600` (labels de formulario), `slate-500` (texto secundario/metadatos), `slate-400` (placeholder, iconos apagados), `slate-200` (borde de campos en reposo).

### Named Rules
**The No Primary Rule.** Ningún tono se usa como "el color de la marca" repetido en todos los botones. Cada huella tiene un rol fijo de acción/categoría (ver arriba); un botón "Guardar" es mint en toda la app, nunca sunshine ni violet. Si una pantalla nueva necesita un botón de acción que no encaja en los roles existentes, se decide su huella por analogía semántica antes de inventar un color nuevo.

**The Color-Isn't-The-Only-Signal Rule.** Cada uso de color (badge de estado, badge de prioridad, notificación sin leer) va siempre acompañado de texto o un ícono — nunca un punto de color solo.

## Typography

**Body/Display Font:** IBM Plex Sans (pesos 400/500/600/700 cargados vía Google Fonts), con `sans-serif` como fallback.

**Character:** Una sola familia para todo — la jerarquía la hace el peso y el tamaño, no un cambio de tipografía. Los títulos usan el peso más pesado cargado (700, clases Tailwind `font-bold`/`font-extrabold`) en vez de una display face separada.

### Hierarchy
- **Heading** (700, `text-2xl`–`text-4xl`, `tracking-tight`): títulos de página (`h1`), nombres de proyecto/tarea.
- **Subheading** (800 vía `font-extrabold`, `text-base`–`text-lg`): encabezados de sección ("Miembros", "Tareas", "Comentarios").
- **Body** (500, `text-sm`): texto de párrafo, descripciones, contenido de tarjetas.
- **Label** (700, `text-xs`–`text-sm`): labels de campo, badges, texto de botón — siempre bold, nunca regular.
- **Metadata** (500, `text-xs`, `slate-400`/`slate-500`): fechas, conteos, hints.

### Named Rules
**The Bold Label Rule.** Labels, badges y texto de botón son siempre `font-bold` o más pesado — nunca `font-normal`. Es lo que hace que los controles se sientan "de juguete sólido" en vez de finos/frágiles.

## Layout

**Shell persistente (`AppShell`)**: toda página autenticada vive detrás de una sidebar fija de 264px (`w-64`) en desktop — logo, nav (Inicio/Notificaciones/Mi perfil, con badge de no leídas) y "Cerrar sesión" — en vez de que cada página repita esos botones en su propio header. En mobile (`<md`) la sidebar colapsa a una barra superior con botón de menú que abre un drawer deslizable (mismo overlay+blur que `ClayModal`, entrada `clay-enter`, cierre con Escape/click afuera/tap en un link). El shell vive en `ProtectedRoute.tsx`, envolviendo el `<Outlet />`: las páginas ya no dibujan su propio `clay-canvas`/fondo ni columna — solo devuelven su contenido.

**Contenido ya no centrado con `mx-auto`**: el área principal (`<main className="md:pl-64">`) ya no fuerza una columna flotando en el medio de la pantalla — el contenido arranca pegado a la sidebar con padding, y el espacio sobrante (si lo hay en pantallas muy anchas) queda a la derecha, no repartido a ambos lados. Dos anchos según el tipo de página:
- **Dashboard** (la página de "explorar"): sin tope de ancho propio más allá del `max-w-6xl` del `<main>`; la lista de proyectos es una **grilla** (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`), no una columna apilada — así aprovecha el ancho en vez de dejarlo vacío.
- **Detalle/formulario** (Notificaciones, Perfil, Nuevo proyecto/tarea): mantienen un ancho de lectura cómodo (`max-w-3xl`, sin `mx-auto`) — son listas de filas y formularios, no tarjetas de grilla, y una fila o un input estirado a todo el ancho de la pantalla se lee peor, no mejor.
- **Proyecto y Tarea** (las dos páginas con más contenido secundario): grilla de dos columnas `lg:grid-cols-[1fr_300px]` (una sola columna por debajo de `lg`) — la columna ancha lleva el contenido principal (tareas/comentarios), la columna angosta de 300px es un rail **sticky** (`lg:sticky lg:top-8`) con la información de apoyo que antes vivía detrás de un modal o dispersa en badges sueltos: "Miembros" en Proyecto (lista + alta/baja inline, ya no hace falta abrir un modal para verla) y "Detalles" en Tarea (prioridad, fecha límite, asignados con nombre, quién y cuándo la creó). El modo edición de estas dos páginas vuelve a una sola columna (formulario angosto, `max-w-2xl`) — es un flujo lineal de "completar campos", no de "leer/repasar", así que no necesita el rail.

Densidad generosa: `gap-2.5`–`gap-4` entre tarjetas de una lista, `p-4`–`p-6` de padding interno. Las barras de filtros/toolbar usan `flex flex-wrap` y se acomodan en fila desde el breakpoint `sm:`; en mobile caen a una columna sin perder ningún control.

## Elevation & Depth

**Plastilina viva**: doble sombra en reposo (`-6px -6px 14px` de luz blanca arriba-izquierda + `8px 8px 18px` de sombra teñida del propio color abajo-derecha, vía la variable `--clay-rgb`), que sube y agranda 1.5% al pasar el mouse, y se **hunde** (sombra interior, no solo se oscurece) al presionar. La profundidad reacciona al toque en vez de ser puramente decorativa.

### Shadow Vocabulary
- **Reposo** (`.clay-surface`): `-6px -6px 14px rgba(255,255,255,.85), 8px 8px 18px rgba(var(--clay-rgb),.28)`.
- **Hover**: `-8px -8px 18px rgba(255,255,255,.9), 10px 10px 24px rgba(var(--clay-rgb),.35)` + `translateY(-3px) scale(1.015)`.
- **Press**: sombra interior `inset 4px 4px 10px rgba(0,0,0,.12), inset -4px -4px 8px rgba(255,255,255,.7)` + `translateY(0) scale(.97)`.
- **Estático** (`.clay-panel`, formularios): la misma sombra de reposo, sin hover ni press — ver Do's and Don'ts.

### Named Rules
**The Press-Sinks Rule.** Presionar nunca solo oscurece: la sombra se invierte a interior para que se sienta como hundir un dedo en plastilina, no como un cambio de opacidad.

## Shapes

Esquinas muy redondeadas en todo (`12px` en controles chicos hasta `26px` en tarjetas grandes) — nunca esquinas rectas. Bordes de **2–3px** sólidos, casi siempre blancos en superficies interactivas (`clay-surface`/`clay-panel`) o del propio tono en badges/inputs — nunca 1px. La combinación borde grueso + esquina muy redonda + sombra doble es la firma visual del sistema; cualquier componente nuevo la mantiene.

## Components

### Botones
- **Forma:** `rounded-2xl` (16px) en tamaño estándar, `rounded-xl` (12px) en `size="sm"`; borde de 3px del tono de la huella.
- **Huella:** se elige por rol de acción (ver Named Rules de Colores), nunca al azar.
- **Estados:** hover = `.clay-surface` (sube+agranda), press = se hunde, disabled = `opacity-40` + sin puntero.
- **Componente:** `ClayButton` (`hue`, `size: 'md'|'sm'`), o `clayButtonStyle(hue)` + `CLAY_BTN_BASE`/`CLAY_BTN_SM_BASE` cuando el elemento no puede ser un `<button>` (p.ej. un `<Link>`).

### Badges
- **Forma:** píldora completa (`rounded-full`), borde de 2px al 50% de opacidad del tono, texto bold.
- **Uso:** estado de tarea, prioridad, rol de miembro — siempre junto a texto legible, nunca solo color.
- **Componente:** `ClayBadge`.

### Campos e inputs
- **Estilo:** `rounded-2xl`, borde de 3px `slate-200`, sombra interior sutil; foco = borde `sky-300` + halo `shadow` de 4px.
- **Componente:** `CLAY_FIELD` (className compartida por `<input>`, `<textarea>` y el trigger de `ClaySelect`), envuelto en `ClayField` para el label bold + hint opcional.

### Select (listbox propio)
- **Por qué existe:** el navegador no permite estilizar la lista desplegada de un `<select>` nativo, solo el control cerrado.
- **Mecánica:** patrón ARIA `listbox` a mano, con la lista renderizada en un **portal a `document.body`** con posición `fixed` calculada desde el trigger — así no queda recortada si el select vive dentro de un contenedor con scroll propio (p.ej. el modal de miembros), y se voltea hacia arriba si no hay lugar abajo.
- **Componente:** `ClaySelect`.

### Modal / Confirmación
- **Por qué existe:** reemplaza `window.confirm()` y cualquier diálogo nativo del navegador, que no se puede estilizar.
- **Mecánica:** overlay con blur, tarjeta con entrada de rebote (`clay-enter`), cierre con Escape/click afuera, foco inicial en el botón de cerrar **solo la primera vez que se abre** (no en cada re-render del padre — ver nota en el código, es un bug ya corregido).
- **Componente:** `ClayModal` (genérico, con `children`) y `ClayConfirmDialog` (construido sobre `ClayModal`, para el par cancelar/confirmar).

### Tarjetas
- **`CLAY_CARD`** (interactiva, con rebote): para lo que se puede tocar/clickear — filas de lista, proyectos, tareas.
- **`CLAY_PANEL`** (estática, misma sombra sin rebote): para contenedores de formulario con inputs de texto adentro. Ver Do's and Don'ts — es una distinción deliberada, no dos nombres para lo mismo.

### Shell de navegación
- **Por qué existe:** antes cada página protegida repetía sus propios botones de "Mi perfil"/"Notificaciones"/"Cerrar sesión" arriba de una columna centrada; con más páginas eso duplicaba código y reforzaba la sensación de "todo apilado en el medio de la pantalla".
- **Mecánica:** sidebar fija en desktop, top-bar + drawer en mobile (ver Layout). El link activo se resuelve comparando `pathname` contra la ruta del item — solo `/`, `/notifications` y `/profile` se resaltan; páginas anidadas (proyecto/tarea) no marcan ningún item.
- **Componente:** `AppShell`, montado una sola vez en `ProtectedRoute.tsx`.

### Tablero Kanban (componente de firma)
El único lugar donde el sistema usa física real de arrastre (GSAP `Draggable`) en vez de solo CSS: la tarjeta sigue al cursor con giro/escala al levantarla, la columna debajo se resalta por `hitTest` en vivo, suelta con rebote elástico si no es una columna válida, y las tarjetas que quedan se reacomodan con `Flip` (sin `absolute: true` — sacar las tarjetas del flujo colapsa la altura de la columna mientras dura la animación, ya fue un bug real). Ver `KanbanBoard.tsx`.

## Do's and Don'ts

### Do:
- **Do** asignar la huella de color por el rol semántico de la acción (crear=sunshine, guardar=mint, eliminar=rose/coral, editar=sky, personas=violet, neutral=stone), no por índice o al azar.
- **Do** usar `CLAY_PANEL` (sin rebote) para cualquier contenedor que tenga un `<input>`/`<textarea>` adentro.
- **Do** construir cualquier diálogo o desplegable nuevo sobre `ClayModal`/`ClaySelect` en vez del `<dialog>`/`<select>` nativo del navegador.
- **Do** acompañar todo badge o indicador de color con texto legible.
- **Do** respetar `prefers-reduced-motion` en cualquier animación nueva (todas las clases `clay-*` ya lo hacen).

### Don't:
- **Don't** introducir un color "principal" que se repita en todos los botones — rompe el sistema completo.
- **Don't** envolver un formulario con inputs de texto en `CLAY_CARD` (con rebote) — el contenedor entero "crece" al pasar el mouse para llegar al campo, y en pantallas angostas puede provocar scroll horizontal (bug real, ya corregido).
- **Don't** usar sombras duras sin blur (`box-shadow: 4px 4px 0`) — no es un mundo neobrutalista.
- **Don't** usar bordes de 1px en superficies `clay-surface`/`clay-panel` — el grosor de 2–3px es parte de la identidad, no un detalle opcional.
- **Don't** usar `Flip` con `absolute: true` para reacomodos que solo cambian de posición dentro del mismo padre — colapsa la altura del contenedor mientras dura la animación.
