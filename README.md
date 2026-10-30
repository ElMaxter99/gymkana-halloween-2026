# 🎃 Gymkana Halloween 2026

**La web que da vida a tu aventura.** Una mini web móvil que acompaña a una gincana de Halloween que se juega en papel. Los jugadores se unen a su equipo y, cuando encuentran un QR escondido, la web les muestra la prueba, les recuerda de qué equipo son y avisa al organizador.

![Gymkana Halloween 2026 — La web que da vida a tu aventura](public/branding/portada-gymkana-halloween-2026.webp)

> La imagen es la referencia visual del evento. La web no la usa como fondo: copia el lenguaje de las hojas impresas y lo aplica a componentes HTML reales. Eso incluye los títulos en slab serif gruesa a dos tintas, las cajas «OBJETIVO:» con marco rojo, el banner de la «Regla de oro», los sellos de lacre, las calaveras, las velas y los murciélagos.

---

## 1. La experiencia de juego

Cada equipo recibe un **sobre** con:

| Hoja | Contenido | ¿Está en la web? |
|---|---|---|
| Reglas de la gincana | 9 reglas, objetivo, regla de oro y victoria | **Sí**, en `/reglas` |
| 0 · Un amigo es un tesoro | Retos con gente durante toda la noche | No (se abre en orden) |
| 1 · La casa maldita | Objetos dentro de la casa | No |
| 2 · Los objetos perdidos | Objetos fuera de la casa | No |
| 3 · El mapa del muerto | Ficha del coordinador: lugares, rutas por equipo y QR | No. Las rutas se marcan en `/admin/qr` (solo las ve el organizador) |
| 4 · El ritual | El último sobre | No |

Los retos de los sobres **no se publican en la web** a propósito: se abren en orden y publicarlos destriparía el juego.

Cómo se usa la web:

1. **Al empezar**, todos escanean el QR de registro, escriben su nombre y eligen su equipo: **Calabaza, Fantasma, Bruja o Zombie**. Si el organizador ha puesto código a ese equipo, lo escriben.
2. **Durante la gincana** el juego es analógico. Hay 4 ubicaciones con QR (**Parkour maldito, Rocódromo, Zigzag y El Anfiteatro**) y **cada equipo tiene que encontrar las 2 de su ruta**. Las rutas las marca el organizador en `/admin/qr` y se pueden cambiar a última hora.
3. Al escanear un QR, la web muestra «Álvaro, perteneces al equipo Zombie», la prueba de esa ubicación y cuántas llevan («1 de 2»), y **registra el escaneo**.
4. El equipo hace la prueba y la **envía por WhatsApp**. El organizador la valida y reparte los puntos en papel. *Si no hay foto o vídeo… no ha pasado.*
5. El organizador lo ve todo **en directo** en su panel y recibe un aviso en **Telegram**.

Escanear un QR solo demuestra que alguien con esa sesión abrió esa URL; **no valida la prueba**.

## 2. Funcionalidades

### Implementadas

- **Portada** con «Unirme a mi equipo», «Reglas de la gincana», «Cómo se juega», la regla de oro y un acceso discreto al panel.
- **Reglas** (`/reglas`) con el texto de la hoja impresa.
- **Registro** (`/registro`): nombre más una de las cuatro tarjetas de equipo. El código solo se pide si el equipo lo tiene. Hay validación en cliente y servidor.
- **Equipos fijos**: los jugadores no pueden crear equipos. La API rechaza cualquier intento.
- **Sin duplicados**: un móvil ya registrado no puede registrarse otra vez sin pulsar «No soy yo», y al hacerlo el jugador anterior se da de baja (sus escaneos se conservan).
- **Pantalla de equipo** (`/equipo`): jugadores, ubicaciones encontradas sobre el objetivo, escaneos y actividad reciente.
- **Páginas de QR** (`/p/<slug>`): equipo y emblema del jugador, prueba de la ubicación, sello «Escaneo registrado» con la hora del servidor, progreso «X de 2» y aviso si es repetido.
- **QR desconocidos o desactivados**: página «Aquí no hay nada…».
- **Panel** (`/admin`):
  - contadores y actividad en directo, con filtros por equipo, jugador y punto;
  - marca «1.º» en el primer escaneo de cada equipo en cada punto;
  - matriz de progreso con el objetivo de 2 ubicaciones por equipo;
  - lista de equipos y jugadores.
- **Equipos y códigos** (`/admin/equipos`): tabla **«Códigos de un vistazo»** con el código de cada equipo. Permite editar, poner o quitar códigos, ver bloqueos por intentos fallidos y activar o desactivar equipos.
- **Puntos QR** (`/admin/qr`): editar textos y **rutas** (a qué equipos les toca cada QR), crear, activar o desactivar puntos e imprimir los QR.
- **Rutas**:
  - el panel muestra «pendiente», «no le toca» y «fuera de ruta»;
  - los QR fuera de ruta no cuentan para el objetivo, y el jugador ve un aviso si escanea uno que no le toca;
  - Telegram añade «⚠️» en esos escaneos.
- **Partidas** (`/admin/partidas`):
  - **«Guardar copia y empezar partida nueva»** guarda jugadores y escaneos en una copia y deja la partida a cero;
  - **«Restaurar esta partida»** la vuelve a poner en juego tal cual;
  - descargas en CSV (Excel) y JSON.
- **Telegram**: un aviso por escaneo y otro por cada jugador nuevo.
- **Diseño**: mobile-first, contraste alto, errores con icono y texto (no solo color), y animaciones que se desactivan con `prefers-reduced-motion`.

### Pendientes o fuera de alcance

- Puntuaciones y clasificación: las reparte el organizador fuera de la web, como dicen las hojas.
- Las ubicaciones de foto del mapa (Casa, Vito y Sara, La Harley, Vito gorra azul) no tienen QR y quedan fuera de la web.
- No se suben fotos ni vídeos. Sin cobertura, el escaneo no se registra hasta recargar con conexión.

## 3. Stack

| Pieza | Uso |
|---|---|
| **Next.js 16** (App Router) + **TypeScript** | Páginas, API y server actions |
| **Supabase** (PostgreSQL) | Equipos, jugadores, QR, escaneos y copias de partidas |
| **Vercel** | Hosting |
| **Telegram Bot API** | Avisos al organizador |
| `qrcode` | QR imprimibles |
| CSS propio + `next/font` | Estilo sin frameworks; fuentes autoalojadas |

Tipografías, autoalojadas en el build y con alternativas del sistema: **Alfa Slab One** para los títulos (la slab gruesa de las hojas) y **Roboto Condensed** para el texto y las etiquetas.

## 4. Arquitectura y carpetas

```
public/
  branding/     portada (README) y og-…jpg (vista previa al compartir)
  textures/     pergamino.svg (ruido SVG de ~1 KB)
src/
  app/
    page.tsx               Portada
    reglas/                Reglas de la gincana
    registro/              Registro (página + formulario cliente con las tarjetas de equipo)
    equipo/                Pantalla del equipo
    p/[slug]/              Página de cada QR (registra el escaneo en el servidor)
    admin/                 Panel (Dashboard.tsx) y login
      equipos/             Códigos y estado de los equipos (server actions)
      qr/                  Puntos QR e impresión
      partidas/            Copias, partida nueva y restauración
    api/register           Unirse a un equipo
    api/leave              «No soy yo»
    api/admin/*            login, logout, overview y archives/[id] (descargas)
    globals.css            Identidad visual
  components/
    ornaments.tsx          SVG: murciélagos, calabaza, calaveras, vela, casa encantada, emblemas de equipo e iconos
    ui.tsx                 TeamBanner, Callout («OBJETIVO:»), GoldenRule, ErrorAlert, SuccessSeal
  lib/                     supabase, player, admin-auth, overview, telegram, crypto, validation, format
supabase/schema.sql        Tablas, funciones, RLS, equipos fijos y QR de serie
```

Todo el acceso a datos se hace en el servidor con la clave secreta de Supabase. El navegador nunca habla con Supabase.

## 5. Equipos y registro

- Equipos fijos: **Calabaza 🎃, Fantasma 👻, Bruja 🧙 y Zombie 🧟**, creados por `schema.sql`. En la web cada uno tiene su emblema en SVG.
- **El código es opcional y lo pone el organizador** en `/admin/equipos`; la idea es darlo en la hoja de cada equipo.
  - Sin código, cualquiera entra al equipo solo con elegirlo, y el panel lo marca en naranja.
  - El código se ve y se edita en `/admin/equipos`. Se guarda legible (`join_code`, solo accesible desde el servidor) para que puedas consultarlo, y la comprobación usa su hash **scrypt + sal**. No distingue mayúsculas.
  - Tras **8 fallos seguidos** el equipo se bloquea **5 minutos**. Poner un código nuevo lo desbloquea.
- Al registrarse, el móvil recibe una cookie `httpOnly` (`gk_device`, 30 días) con un token aleatorio. En la base de datos solo se guarda su hash SHA-256.
- El navegador solo recibe el id, el nombre y si el equipo pide código; nunca hashes ni jugadores de otros equipos.
- Límite de jugadores por equipo: `MAX_PLAYERS_PER_TEAM` (20). Los nombres se sanean en el servidor.

## 6. Ubicaciones con QR y rutas

| Ubicación | Prueba de serie |
|---|---|
| Parkour maldito | Todo el equipo debe participar en un vídeo donde se realice parte del circuito de parkour. |
| Rocódromo | Vídeo de un integrante del equipo completándolo o aguantando arriba 10 segundos. |
| Zigzag | Recorred el zigzag en fila como una procesión de zombis: cada uno agarrado a los hombros del de delante, arrastrando los pies y sin soltaros. Grabad un vídeo de todo el recorrido. |
| El Anfiteatro | Recread una escena de una película de terror. |

- **URLs secretas.** El script genera un sufijo aleatorio distinto en cada base de datos (`/p/parkour-3f9a1c…`), así que las URLs no están en este repositorio, que es **público**. Las URLs reales se ven en `/admin/qr`.
- **Rutas.** No vienen precargadas, para no publicar el mapa en el repositorio: márcalas en `/admin/qr` → cada punto → «Equipos que tienen este QR en su ruta».
  - Sin rutas marcadas, todo funciona igual, pero sin avisos de «fuera de ruta».
- Los textos se cambian en `/admin/qr`. Volver a ejecutar `schema.sql` no pisa ni los textos ni las rutas.
- **Objetivo por equipo:** `QR_PER_TEAM` (2). Se muestra al jugador («1 de 2») y en el panel (✓ al completar). Solo cuentan los QR de su ruta.
- Al abrir la página, el servidor comprueba que el punto existe y está activo, identifica al jugador por su cookie e **inserta el escaneo con la hora del servidor**.
- Si el jugador no está identificado, va a `/registro?next=/p/<slug>` y al terminar vuelve solo al QR. No hay redirecciones abiertas.

### Escaneos repetidos

**Se guardan todos**: recargas y escaneos de varios móviles del mismo equipo incluidos.
- El jugador ve si es la primera vez que su equipo registra ese QR.
- El panel marca el primero con «1.º».
- Telegram añade «🔁 Repetido» (y «⚠️» si es fuera de ruta).
- El progreso cuenta ubicaciones **distintas**.

## 7. Panel privado

- `/admin` redirige a `/admin/login` si no hay sesión. La contraseña es `ADMIN_PASSWORD`.
- La sesión es una cookie `httpOnly`, `SameSite=Strict`, firmada con HMAC (`ADMIN_SESSION_SECRET`) y válida 12 h.
- **Todas** las rutas, server actions y descargas comprueban la sesión en el servidor.
- El panel se actualiza cada 5 s mientras la pestaña está visible. Si se pierde la conexión, el indicador «En directo» se pone naranja.
- Muestra los 500 escaneos más recientes; los totales y la matriz cuentan todos.

### Partidas: ensayos, copias y recuperación

Pensado para hacer varias partidas de prueba y que el día del evento todo esté limpio:

- **Guardar copia y empezar partida nueva** (pide marcar una casilla de confirmación):
  - guarda jugadores y escaneos en `game_archives` y deja la partida a cero;
  - **se mantienen equipos, códigos y QR**;
  - los móviles dejan de estar identificados y hay que volver a registrarse.
- **Restaurar esta partida**:
  - vuelve a poner una copia en juego tal cual: **los móviles de esa partida vuelven a estar identificados** y los escaneos se recuperan;
  - si la partida actual tiene datos, **antes se guarda como «Copia automática antes de restaurar…»**, así que restaurar por error tampoco pierde nada.
- **Las copias no se pueden borrar desde la web.**
- Guardar y restaurar son funciones de Postgres (`archive_game`, `restore_game`). Si algo falla a medias, no se borra nada.
- Descargas: escaneos en **CSV** (separador `;`, se abre en Excel con acentos) y **JSON** legible (sin datos internos).

## 8. Telegram

Opcional. **Guía paso a paso (crear el bot, conseguir el chat id, grupos, Vercel y solución de problemas): [docs/TELEGRAM.md](docs/TELEGRAM.md).**

```
🎃 NUEVO ESCANEO
👥 Equipo: Zombie
🧙 Jugador: Álvaro
📍 Punto: Parkour maldito
🕒 Hora: 22:14
```

El aviso se envía después de guardar el escaneo, con un límite de 5 s. Si Telegram falla o no está configurado, el juego sigue.

## 9. Modelo de datos (Supabase)

| Tabla / función | Contenido |
|---|---|
| `teams` | `name`, `name_key` (único), `join_code` (visible para el organizador), `join_code_hash` (null = sin código), intentos fallidos, `locked_until`, `active` |
| `players` | `display_name`, `team_id`, `device_token_hash` (único), `active` |
| `qr_points` | `slug`, `title`, `instructions`, `sort_order`, `active`, `assigned_team_ids` (ruta) |
| `scan_events` | `player_id`, `team_id`, `qr_point_id`, `scanned_at` (servidor), `user_agent` |
| `game_archives` | `label`, `archived_at`, contadores y `data` (versión legible + filas originales para restaurar) |
| `archive_game(label)` / `restore_game(id)` | Guardar y empezar de cero / restaurar, cada una en una transacción |

Seguridad:
- **RLS activado en todas las tablas y sin políticas.**
- Además se **retiran los permisos** de `anon` y `authenticated` sobre tablas y funciones: con la clave pública no se puede leer nada ni ejecutar las funciones.
- Solo el servidor accede, con la clave secreta.

## 10. Variables de entorno

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
# Clave SECRETA: «Secret key» (sb_secret_…) o la «service_role» de las claves antiguas.
# ¡No la «Publishable key» (sb_publishable_…)! Con esa la app recibe «permission denied».
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxx
ADMIN_PASSWORD=una-frase-larga-que-solo-sepas-tu
ADMIN_SESSION_SECRET=resultado-de-openssl-rand-base64-48
TELEGRAM_BOT_TOKEN=123456:ABC-token-de-ejemplo
TELEGRAM_CHAT_ID=123456789
EVENT_TIMEZONE=Europe/Madrid
MAX_PLAYERS_PER_TEAM=20
QR_PER_TEAM=2
# Opcional: dominio para las vistas previas al compartir (en Vercel se detecta solo)
SITE_URL=https://tu-dominio.vercel.app
```

Ninguna variable lleva prefijo `NEXT_PUBLIC_`. El panel usa un refresco autenticado cada 5 s en vez de Supabase Realtime: Realtime obligaría a exponer la clave pública con permisos de lectura.

## 11. Instalación local

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Comandos: `npm run dev`, `npm run build`, `npm run start` y `npm run typecheck`. No hay linter configurado; `typecheck` y `build` comprueban los tipos.

## 12. Configurar la base de datos

1. *SQL Editor* → pega `supabase/schema.sql` completo → *Run*.
   - Es **re-ejecutable** y sirve también para actualizar una base creada con una versión anterior del script.
   - Crea los 4 equipos, los 4 QR de serie (con URL aleatoria) y las copias de partidas.
   - Si venías de la versión con URLs fijas (`parkour-7qk2mz`…), las cambia por aleatorias: imprime los QR después de ejecutarlo.
   - Borra los QR de ejemplo antiguos (calabaza, cripta y bruja). Los equipos de prueba que hubiera no los borra: desactívalos en `/admin/equipos`.
2. *Project Settings → API Keys*: copia la URL y la **clave secreta** en las variables.
3. En `/admin/equipos`, pon el código de cada equipo si quieres usarlo.
4. En `/admin/qr`, marca la ruta de cada QR según el mapa del muerto.

## 13. Despliegue en Vercel

1. Importa el repositorio (Vercel detecta Next.js).
2. Añade las variables de §10 en *Settings → Environment Variables* y despliega.
3. Abre `/admin/qr` **desde el dominio definitivo** e imprime los QR. Las URLs se generan con el dominio desde el que abres la página.
4. Escanea cada QR impreso con iOS y Android, usando datos móviles.

## 14. Cómo probar el flujo completo

1. En `/admin/equipos`, pon un código a un equipo y deja otro sin código.
2. Móvil A: registro → equipo con código → prueba un código erróneo (error visible) y luego el correcto → «¡Ya estás dentro!».
3. Móvil B: escanea un QR sin estar registrado → registro → equipo sin código → vuelve solo al QR → «Escaneo registrado · 1 de 2».
4. `/equipo`, `/admin` (aparece sin recargar) y Telegram.
5. `/admin/partidas` → «Guardar copia y empezar partida nueva» → los móviles piden registro otra vez → «Restaurar» → los móviles vuelven a estar identificados.
6. Antes del evento: «Guardar copia y empezar partida nueva» para dejarlo todo de serie.

## 15. Pruebas realizadas en este repositorio

Ejecutadas el 30/10/2026 sobre el build de producción (`next build` + `next start`).

**No se ha probado la app contra un Supabase real, un bot de Telegram real ni Vercel.**
- Para ejecutar la app de punta a punta se usó un **doble en memoria de la API PostgREST** que reproduce las consultas, restricciones y RPC que usa la app.
- El SQL se probó por separado en **PostgreSQL 16 real**.
- Contra el proyecto de Supabase del organizador solo se hizo una consulta de lectura con la clave publicable. Respondió `permission denied` en `teams` y `qr_points`, lo que confirma que las tablas existen y que la clave pública no puede leerlas.

Resultados:

- `npm run typecheck` y `npm run build`: sin errores ni avisos.
- **SQL en PostgreSQL 16**:
  - el script se aplica dos veces seguidas sin duplicar nada y migra una base creada con la versión anterior;
  - genera URLs aleatorias y sustituye las URLs fijas que estaban publicadas;
  - `archive_game` guarda jugadores y escaneos, vacía la partida y conserva equipos, códigos y QR;
  - `restore_game` recupera jugadores con su identidad y escaneos, y los escaneos nuevos continúan la numeración;
  - restaurar con partida en curso crea la copia automática;
  - `anon` no puede ejecutar las funciones ni leer las copias.
- **34 comprobaciones HTTP, todas correctas**:
  - portada, reglas y los 4 equipos en orden;
  - no se pueden crear equipos; validaciones; unirse sin código; móvil duplicado;
  - escaneos válidos, repetidos, desconocidos e inválidos; redirección al registro;
  - pantalla de equipo y baja de jugador;
  - autenticación del panel en `/admin`, `/admin/qr` y `/admin/equipos`, y datos del panel;
  - cabeceras de seguridad.
- **30 comprobaciones en Chromium (Playwright)** a 390×844 y 1280×900, todas correctas:
  - el organizador pone código, que se ve en «Códigos de un vistazo» y en el campo de edición;
  - validaciones en el cliente; el código se pide solo cuando corresponde; código erróneo y correcto;
  - marcar la ruta de un QR y ver «fuera de ruta», «pendiente» y «no le toca» en el panel; el jugador ve el aviso y ese QR no cuenta para su objetivo;
  - registro desde un QR con vuelta al QR; el panel se actualiza solo; filtros; crear un QR desde el panel;
  - bloqueo tras 8 fallos, visible en el panel, y desbloqueo al cambiar el código;
  - guardar copia y partida nueva, descarga CSV, 401 sin sesión, copia automática y restauración con los móviles identificados de nuevo y todos los escaneos;
  - movimiento reducido y **sin desplazamiento horizontal**.
  - Los únicos errores de consola son los 401, 403 y 404 esperados de las pruebas negativas.
- Telegram, en la ronda anterior: con un token falso responde 401, se registra y el juego continúa. Sin configurar, no se intenta enviar.

## 16. Seguridad y limitaciones conocidas

- La cookie identifica un **navegador**, no a una persona. En otro navegador o en modo incógnito hay que registrarse de nuevo.
- Un escaneo no prueba que se haya hecho la prueba.
- Un equipo sin código lo puede elegir cualquiera; pon códigos si te preocupa que alguien se cambie de equipo.
- Contraseña de panel compartida: suficiente para un evento puntual.
- Cabeceras: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: same-origin` y `Permissions-Policy` restrictiva. La web no se indexa.
- Datos personales: solo nombres de pila y user agent. Las copias se guardan hasta que se borren a mano en Supabase; bórralas después del evento.

## 17. Configuración pendiente (manual)

- [ ] Poner en `SUPABASE_SERVICE_ROLE_KEY` la **clave secreta**, no la publicable.
- [ ] Ejecutar la última versión de `supabase/schema.sql`.
- [ ] Configurar `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` (y Telegram si se quiere).
- [ ] Decidir si los equipos llevan código y ponerlo en `/admin/equipos`.
- [ ] Marcar en `/admin/qr` la ruta de cada QR según el mapa del muerto.
- [ ] Valorar hacer el repositorio **privado**: es público y contiene los textos de las pruebas de los QR.
- [ ] Imprimir los QR desde el dominio definitivo, hacer un ensayo y pulsar «Guardar copia y empezar partida nueva» antes del evento.

## 18. Notas para quien continúe el desarrollo

- Colores en variables de `globals.css` (`--parchment`, `--blood`, `--pumpkin`, `--gold`…).
  - Clases de la página: `.parchment`, `.btn-seal`, `.btn-wood`, `.callout`, `.golden-rule`, `.wax-seal`.
  - Clases del panel: `.panel`.
  - Títulos a dos tintas: `.accent` o `.accent-red` dentro de un `.title`.
- Iconos y emblemas en `src/components/ornaments.tsx` (`TeamEmblem` elige el emblema por nombre de equipo).
- Identidad del jugador: `getCurrentPlayer()`. Organizador: `isAdmin()` / `requireAdmin()`. Objetivo de QR: `qrGoal()`. Rutas: `isOffRoute()` y `countPointsOnRoute()` en `lib/overview.ts`.
- Consultas siempre en el servidor con `db()`. No añadas políticas RLS públicas.
- Si cambias columnas de `players` o `scan_events`, actualiza `restore_game` en `schema.sql`.
