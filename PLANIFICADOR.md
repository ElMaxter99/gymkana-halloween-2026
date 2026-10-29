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

### Fase 2 — Configuración (pendiente, Álvaro)
- [ ] Crear proyecto Supabase y ejecutar `supabase/schema.sql`
- [ ] Crear bot de Telegram y obtener `TELEGRAM_CHAT_ID`
- [ ] Importar el repo en Vercel y configurar variables de entorno
- [ ] Decidir dominio definitivo

### Fase 3 — Contenido (pendiente)
- [ ] Definir los 2–3 puntos QR reales (título + instrucciones) en `/admin/qr`
- [ ] Desactivar o editar los QR de ejemplo
- [ ] Imprimir el QR de registro y los de cada punto desde el dominio definitivo

### Fase 4 — Ensayo general
- [ ] Crear 2–3 equipos de prueba con 2 móviles cada uno (iOS y Android, con datos móviles)
- [ ] Probar código incorrecto y nombre de equipo duplicado
- [ ] Escanear cada QR impreso; comprobar panel y Telegram
- [ ] Borrar datos de prueba antes del evento:
      `delete from scan_events; delete from players; delete from teams;`

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
| `/admin` sin sesión | Redirige a `/admin/login` |
| `/api/admin/overview` sin sesión | 401 |

## Riesgos conocidos

- La cookie identifica un navegador, no a una persona: un escaneo no prueba que se haya hecho la prueba.
- Si se abre el QR en modo incógnito o en otro navegador, pedirá registrarse de nuevo.
- Sin cobertura no se registra el escaneo hasta que haya conexión (no hay cola offline).
- La contraseña de admin es compartida (suficiente para un evento puntual).
- Recomendado borrar los datos personales después del evento.
