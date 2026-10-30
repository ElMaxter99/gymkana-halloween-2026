# Planificador — Gymkana Halloween 2026

**Objetivo**: web móvil para identificar jugadores y equipos, registrar cada escaneo de los QR escondidos durante una gymkana analógica y avisar al coordinador (panel privado + Telegram).

**Fuera de alcance**: gestionar pruebas, evidencias, fotos/vídeos, puntuaciones o clasificación. Las evidencias van por WhatsApp.

## Decisiones tomadas

- Varios móviles por equipo; cada jugador tiene identidad propia y comparte `team_id`.
- Los propios jugadores crean el equipo; los demás se unen eligiéndolo de una lista + código.
- Se guardan **todos** los escaneos (incluidas recargas); el panel destaca el primero por equipo y QR.
- Avisos: panel en directo (polling 5 s) + Telegram.
- Stack: Next.js 16 (App Router, TypeScript) · Supabase Postgres · Vercel · Telegram Bot API · CSS propio.

## Modelo de datos (`supabase/schema.sql`)

- `teams`: nombre único (sin distinguir mayúsculas), hash del código, contador de fallos y bloqueo temporal.
- `players`: nombre, equipo, hash del token del dispositivo.
- `qr_points`: slug de la URL, título, instrucciones, orden, activo.
- `scan_events`: jugador, equipo, punto, hora del servidor, user agent.

RLS activado en todo y sin políticas → solo el servidor (service role) accede.

## Estado por fases

### Fase 1 — Código ✅
- [x] Proyecto Next.js + TypeScript, compila con `npm run build`
- [x] Esquema SQL con restricciones y QR de ejemplo
- [x] Registro: crear equipo / unirse con código (bloqueo tras 8 fallos)
- [x] Página QR: «sois el equipo X» + instrucciones + guarda escaneo
- [x] Redirección a registro si no está identificado y vuelta al QR
- [x] Panel con contadores, matriz equipo × QR, feed de escaneos, equipos/jugadores
- [x] Gestión de puntos QR e impresión de códigos en `/admin/qr`
- [x] Avisos de Telegram (registro, unión y escaneo)

### Fase 1b — Identidad visual y mejoras ✅
- [x] Estética de las hojas impresas: pergamino, sellos de lacre, rojo sangre, oro envejecido, adornos SVG
- [x] Portada con «Crear equipo» / «Unirme» / «Cómo se juega» y acceso discreto al panel
- [x] Pantalla de equipo (`/equipo`): jugadores, escaneos, QR distintos, actividad
- [x] Página de QR con sello de registro, hora del servidor y aviso de escaneo repetido
- [x] Panel: filtros por equipo/jugador/punto, marca «1.º», indicador en directo, vista móvil apilada
- [x] Anti-duplicados (móvil ya registrado, baja con «No soy yo») y límites `MAX_TEAMS` / `MAX_PLAYERS_PER_TEAM`
- [x] Telegram con el formato «🎃 NUEVO ESCANEO …»
- [x] Cabeceras de seguridad y `revoke` de permisos públicos en el esquema
- [x] Pruebas: 33 comprobaciones HTTP + recorrido en Chromium (móvil y escritorio) contra un doble de PostgREST

### Fase 1c — Equipos fijos, hojas del sobre y partidas ✅
- [x] Equipos fijos Calabaza, Fantasma, Bruja y Zombie; los jugadores ya no crean equipos
- [x] Código opcional por equipo, gestionado en `/admin/equipos`
- [x] Estilo de las hojas impresas: slab serif a dos tintas, cajas «OBJETIVO:», banner «Regla de oro», emblemas SVG
- [x] Página `/reglas` con la hoja de reglas (los retos de los sobres 0–4 no se publican)
- [x] 4 ubicaciones con QR y textos de serie; objetivo de 2 por equipo (`QR_PER_TEAM`)
- [x] `/admin/partidas`: guardar copia y empezar de cero, restaurar (con copia automática), descargas CSV/JSON
- [x] Sobre 3 · El mapa del muerto: rutas por equipo editables en `/admin/qr` (no se guardan en el repositorio)
- [x] Códigos de equipo visibles y editables en `/admin/equipos`
- [x] URLs de QR aleatorias por base de datos (el repositorio es público)
- [x] Guía de Telegram en `docs/TELEGRAM.md`

### Fase 1d — Sobres en la app ✅
- [x] Sobres 0–4 en `/sobres`, sellados hasta que el organizador los abre en `/admin/sobres`
- [x] Personalización por equipo (nombre, inicial, ruta y mapa del sobre 3; QR escaneados marcados)
- [x] Rutas del mapa precargadas en `schema.sql` (editables en `/admin/qr`); «Nueva partida» vuelve a sellar los sobres
- [x] README reescrito como portfolio y guía para reutilizarlo otros años

### Fase 1e — Marcador en tiempo real ✅
- [x] Panel `/admin/puntos` (una mano): validar pruebas, bonus, «más creativa», extras, notas y deshacer
- [x] Historial y configuración (puntos, pruebas, bonus, nombres); reiniciar con confirmación
- [x] `/tv` y `/marcador` públicos que se actualizan solos (Supabase Realtime + sondeo de respaldo)
- [x] QR del mapa → «pendiente de validar»; partidas guardan y restauran el marcador
- [x] Tests de puntuación (`npm test`) y prueba de punta a punta con panel + TV + móvil
- [ ] Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel y comprobar «● En directo»

### Fase 2 — Configuración (pendiente, Álvaro)
- [ ] Usar la clave SECRETA de Supabase (no la publicable) y volver a ejecutar `supabase/schema.sql`
- [ ] Crear proyecto Supabase y ejecutar `supabase/schema.sql`
- [ ] Crear bot de Telegram y obtener `TELEGRAM_CHAT_ID`
- [ ] Importar el repo en Vercel y configurar variables de entorno
- [ ] Decidir dominio definitivo

### Fase 3 — Contenido (pendiente)
- [x] Ubicaciones y textos de los QR (Parkour maldito, Rocódromo, Zigzag, El Anfiteatro)
- [x] Rutas de los QR según el mapa del muerto (precargadas)
- [ ] Día del evento: abrir los sobres en `/admin/sobres` a medida que avance la noche
- [ ] Imprimir el QR de registro y los de cada punto desde el dominio definitivo

### Fase 4 — Ensayo general
- [ ] Crear 2–3 equipos de prueba con 2 móviles cada uno (iOS y Android, con datos móviles)
- [ ] Probar código incorrecto y nombre de equipo duplicado
- [ ] Escanear cada QR impreso; comprobar panel y Telegram
- [ ] Antes del evento: `/admin/partidas` → «Guardar copia y empezar partida nueva»

## Pruebas de aceptación

| Caso | Esperado |
|---|---|
| Jugador crea un equipo | Se crea equipo + jugador; aviso Telegram |
| Otro se une con código válido | Nuevo jugador en el mismo equipo |
| Código incorrecto | «Código incorrecto»; tras 8 fallos, bloqueo 5 min |
| Nombre de equipo repetido | Pide otro nombre |
| Sin registrar abre un QR | Va a `/registro` y vuelve al QR al terminar |
| Registrado abre un QR activo | Ve su equipo + instrucciones; se guarda el escaneo |
| Vuelve a abrir el mismo QR | Se guarda otro escaneo |
| QR inexistente o desactivado | Página «Aquí no hay nada…» |
| Telegram caído | El escaneo se guarda igual |
| Móvil ya registrado intenta registrarse otra vez | Se rechaza; debe pulsar «No soy yo» |
| `/admin` sin sesión | Redirige a `/admin/login` |
| `/api/admin/overview` sin sesión | 401 |

## Riesgos conocidos

- La cookie identifica un navegador, no a una persona: un escaneo no prueba que se haya hecho la prueba.
- Si se abre el QR en modo incógnito o en otro navegador, pedirá registrarse de nuevo.
- Sin cobertura no se registra el escaneo hasta que haya conexión (no hay cola offline).
- La contraseña de admin es compartida (suficiente para un evento puntual).
- Recomendado borrar los datos personales después del evento.
