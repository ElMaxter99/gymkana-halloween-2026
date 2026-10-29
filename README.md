# 🎃 Gymkana Halloween 2026

**La web que da vida a tu aventura.** Una mini web móvil que acompaña a una gymkana de Halloween que se juega en papel: los jugadores registran su equipo, y cuando encuentran un QR escondido la web les muestra la prueba, les recuerda de qué equipo son y avisa al organizador.

![Gymkana Halloween 2026 — La web que da vida a tu aventura](public/branding/portada-gymkana-halloween-2026.webp)

> La imagen es la referencia visual del evento. La web no la usa como fondo: toma su lenguaje (pergamino, sellos de lacre, rojo sangre, oro envejecido, murciélagos y casas encantadas) y lo aplica a componentes HTML reales.

---

## 1. La experiencia de juego

1. **Antes de empezar**, todos escanean el QR general de registro. El primero de cada grupo **crea el equipo** e inventa un código secreto; los demás **se unen** eligiendo el equipo de la lista y escribiendo ese código.
2. **Durante la gymkana**, el juego es analógico: mapas, sobres y objetivos en papel.
3. En 2–3 lugares hay **QR escondidos**. Al escanearlos, la web muestra «Álvaro, perteneces al equipo Los Lobos», el título del punto y las instrucciones de la prueba, y **registra el escaneo** en el servidor.
4. El equipo hace la prueba (foto o vídeo) y la **envía por WhatsApp** al organizador, que decide si es válida.
5. El organizador ve la actividad **en directo** en su panel y recibe un aviso en **Telegram**.

Escanear un QR solo demuestra que alguien con esa sesión abrió esa URL; **no valida la prueba**. La web lo dice así en todas las pantallas.

## 2. Funcionalidades

### Implementadas

- Portada temática con «Crear equipo», «Unirme a un equipo», «Cómo se juega» y un acceso discreto al panel.
- Registro de jugadores: crear equipo (nombre + código) o unirse (lista + código), con validación en cliente y servidor y errores claros.
- Protección frente a duplicados: un móvil ya registrado no puede registrarse otra vez sin pulsar «No soy yo»; al hacerlo, el jugador anterior se da de baja (sus escaneos se conservan).
- Pantalla de equipo (`/equipo`): jugadores, número de escaneos, QR distintos encontrados y actividad reciente del equipo.
- Páginas de QR (`/p/<slug>`): equipo del jugador, título e instrucciones, sello de «Escaneo registrado» con la hora del servidor y aviso si el equipo ya lo había escaneado.
- QR desconocidos o desactivados: página «Aquí no hay nada…».
- Panel privado (`/admin`): contadores, actividad en orden cronológico con filtros por equipo, jugador y punto, marca del primer escaneo, matriz de progreso equipo × QR, equipos y jugadores, indicador «En directo» y actualización automática.
- Gestión de QR (`/admin/qr`): crear, editar, activar o desactivar puntos e imprimir los códigos QR (incluido el de registro).
- Avisos de Telegram por cada escaneo, equipo nuevo y jugador nuevo.
- Diseño mobile-first, contraste alto, errores con icono y texto (no solo color), y animaciones sutiles que se desactivan con `prefers-reduced-motion`.

### Pendientes o fuera de alcance

- Sin puntuaciones, clasificación ni validación de pruebas (decisión del evento: las evidencias van por WhatsApp).
- No se suben fotos ni vídeos.
- Sin cola offline: sin cobertura, el escaneo no se registra hasta recargar con conexión.
- El panel usa sondeo cada 5 s, no Supabase Realtime (ver §10).
- No hay gestión de equipos desde el panel (renombrar o borrar): se hace en Supabase.

## 3. Stack

| Pieza | Uso |
|---|---|
| **Next.js 16** (App Router) + **TypeScript** | Páginas, API y server actions en un único proyecto |
| **Supabase** (PostgreSQL) | Equipos, jugadores, puntos QR y escaneos |
| **Vercel** | Hosting |
| **Telegram Bot API** | Avisos al organizador |
| `qrcode` | Generación de los QR imprimibles |
| CSS propio + `next/font` | Estilo sin frameworks; fuentes autoalojadas |

Tipografías (descargadas en el build y servidas desde el propio dominio, con alternativas del sistema): **Grenze Gotisch** (títulos), **IM Fell English SC** (etiquetas de imprenta) y **Roboto Condensed** (texto).

## 4. Arquitectura y carpetas

```
public/
  branding/     portada-gymkana-halloween-2026.webp (README) · og-…jpg (vista previa al compartir)
  textures/     pergamino.svg (ruido SVG de ~1 KB para el papel)
src/
  app/
    page.tsx               Portada
    registro/              Registro (página + formulario cliente)
    equipo/                Pantalla del equipo
    p/[slug]/              Página de cada QR (registra el escaneo en el servidor)
    admin/                 Panel (Dashboard.tsx), login y gestión de QR (qr/ + actions.ts)
    api/register           Crear equipo / unirse
    api/leave              «No soy yo»: baja del jugador y borrado de la cookie
    api/admin/*            login, logout y overview (datos del panel)
    globals.css            Identidad visual (variables de color, pergamino, sellos, panel)
    icon.svg               Favicon (calabaza)
  components/
    ornaments.tsx          Murciélagos, calabaza, brújula, vela, telaraña, casa encantada, sellos e iconos (SVG)
    ui.tsx                 TeamBanner, ErrorAlert, SuccessSeal
  lib/
    supabase.ts            Cliente con service role (solo servidor)
    player.ts              Identidad del dispositivo (cookie → jugador)
    admin-auth.ts          Sesión del organizador (cookie firmada con HMAC)
    overview.ts            Consultas del panel
    telegram.ts            Envío y formato de avisos
    crypto.ts · validation.ts · format.ts
supabase/schema.sql        Tablas, restricciones, RLS y QR de ejemplo
```

Todo acceso a datos se hace en el servidor con la service role key. El navegador nunca habla con Supabase directamente.

## 5. Registro de jugadores y equipos

- **Crear**: nombre del jugador + nombre del equipo (único, sin distinguir mayúsculas ni espacios) + código de al menos 4 caracteres.
- **Unirse**: el formulario solo recibe `id` y `nombre` de cada equipo; nunca códigos ni jugadores de otros equipos. El código no distingue mayúsculas.
- El código se guarda con **scrypt + sal**. Tras **8 fallos seguidos** el equipo se bloquea **5 minutos**.
- Al registrarse, el móvil recibe una cookie `httpOnly` (`gk_device`, 30 días) con un token aleatorio; en la base de datos solo se guarda su **hash SHA-256**.
- Límites anti-spam configurables: `MAX_TEAMS` (40 por defecto) y `MAX_PLAYERS_PER_TEAM` (20).
- Nombres saneados en el servidor: sin caracteres de control, espacios colapsados, máximo 40 caracteres.

## 6. Funcionamiento de los QR

- Cada punto tiene una URL `/p/<slug>`. Los slugs creados desde el panel llevan un sufijo aleatorio (`/p/el-viejo-cementerio-k8w3rtxq`) para que no se puedan adivinar.
- Al abrir la página, el servidor comprueba que el punto existe y está activo, identifica al jugador por su cookie e **inserta el escaneo con la hora del servidor**.
- Sin identificar → `/registro?next=/p/<slug>`; al terminar el registro vuelve automáticamente al QR. Solo se aceptan destinos `/p/...` (sin redirecciones abiertas).

### Escaneos repetidos

**Decisión: se guardan todos**, también las recargas y los escaneos de varios móviles del mismo equipo. Para que no haya confusión:

- el jugador ve si es la **primera vez** que su equipo registra ese QR o cuántas lleva;
- el panel marca con **«1.º»** el primer escaneo de cada equipo en cada punto y la matriz de progreso muestra la hora del primero y el total;
- Telegram añade «🔁 Repetido» cuando no es el primero.

Si en algún momento se quiere ignorar los repetidos, basta con filtrar por la marca de primer escaneo; no hace falta tocar la base de datos.

## 7. Panel privado

- `/admin` → `/admin/login` si no hay sesión. La contraseña es `ADMIN_PASSWORD`; la sesión es una cookie `httpOnly`, `SameSite=Strict`, firmada con HMAC (`ADMIN_SESSION_SECRET`) y válida 12 h.
- **Todas** las rutas y acciones de administración comprueban la sesión en el servidor (`/api/admin/overview` responde 401 sin ella; las server actions de `/admin/qr` también la verifican).
- Se actualiza cada 5 s mientras la pestaña está visible y al volver a ella; el indicador «En directo» pasa a naranja si se pierde la conexión.
- Muestra los 500 escaneos más recientes (los totales y la matriz cuentan todos).
- En el móvil, la actividad se muestra como fichas apiladas para no perder columnas.

## 8. Telegram

1. Habla con [@BotFather](https://t.me/BotFather) → `/newbot` y copia el token.
2. Escribe cualquier cosa a tu bot (o añádelo a un grupo).
3. Abre `https://api.telegram.org/bot<TOKEN>/getUpdates` y copia `chat.id`.
4. Configura `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.

Mensaje de cada escaneo (datos sacados del registro guardado):

```
🎃 NUEVO ESCANEO
👥 Equipo: Los Lobos
🧙 Jugador: Álvaro
📍 Punto: El Viejo Cementerio
🕒 Hora: 22:14
```

- El envío ocurre **después** de guardar el escaneo y de responder al jugador (`after()` de Next.js), con un tiempo máximo de 5 s.
- Si Telegram falla o no está configurado, el escaneo queda guardado y el jugador no nota nada; en los logs solo aparece el código de estado (nunca la URL con el token).
- Para eventos con muchos escaneos por segundo, Telegram puede limitar envíos; el panel sigue siendo la fuente de verdad.

## 9. Modelo de datos (Supabase)

| Tabla | Campos clave |
|---|---|
| `teams` | `name`, `name_key` (único, minúsculas), `join_code_hash`, `failed_join_attempts`, `locked_until`, `active` |
| `players` | `display_name`, `team_id`, `device_token_hash` (único), `active` |
| `qr_points` | `slug` (único, `^[a-z0-9-]{3,64}$`), `title`, `instructions`, `sort_order`, `active` |
| `scan_events` | `player_id`, `team_id`, `qr_point_id`, `scanned_at` (hora del servidor), `user_agent` |

Seguridad de la base de datos:

- **RLS activado en todas las tablas y sin políticas**: con la anon key no se puede leer ni escribir nada.
- Además, el script **retira los permisos** que Supabase concede por defecto a `anon` y `authenticated`.
- Solo el servidor accede, con `SUPABASE_SERVICE_ROLE_KEY`.

## 10. Variables de entorno

Copia `.env.example` a `.env.local`. Valores ficticios de ejemplo:

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...clave-service-role...
ADMIN_PASSWORD=una-frase-larga-que-solo-sepas-tu
ADMIN_SESSION_SECRET=resultado-de-openssl-rand-base64-48
TELEGRAM_BOT_TOKEN=123456:ABC-token-de-ejemplo
TELEGRAM_CHAT_ID=123456789
EVENT_TIMEZONE=Europe/Madrid
MAX_TEAMS=40
MAX_PLAYERS_PER_TEAM=20
# Opcional: dominio para las vistas previas al compartir (en Vercel se detecta solo)
SITE_URL=https://tu-dominio.vercel.app
```

Ninguna variable lleva prefijo `NEXT_PUBLIC_`: ningún secreto llega al navegador. No se usa la anon key.

Sobre el tiempo real: Supabase Realtime necesitaría exponer la anon key y crear políticas de lectura, lo que haría públicos los nombres y escaneos. Por eso el panel usa sondeo autenticado cada 5 s, suficiente para un evento de este tamaño.

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

Abre http://localhost:3000. Comandos disponibles: `npm run dev`, `npm run build`, `npm run start` y `npm run typecheck`. El proyecto no tiene linter configurado; `npm run typecheck` y `npm run build` hacen la comprobación de tipos.

## 12. Configurar la base de datos

1. Crea un proyecto en [Supabase](https://supabase.com).
2. *SQL Editor* → pega `supabase/schema.sql` completo → *Run*. Es idempotente: se puede volver a ejecutar.
3. *Project Settings → API*: copia la URL y la **service_role** key en las variables de entorno.
4. Los 3 QR de ejemplo se pueden editar o desactivar desde `/admin/qr`.

Para borrar los datos de prueba antes del evento (conserva los QR):

```sql
delete from scan_events; delete from players; delete from teams;
```

## 13. Despliegue en Vercel

1. Importa el repositorio en Vercel (detecta Next.js automáticamente).
2. Añade las variables de entorno de §10 en *Settings → Environment Variables*.
3. Despliega y abre la URL pública.
4. Entra en `/admin/qr` **desde el dominio definitivo**: las URLs de los QR se generan con el dominio desde el que abres la página.
5. Imprime los QR y escanéalos uno a uno con iOS y Android usando datos móviles.

## 14. Cómo probar el flujo completo

1. Móvil A: escanea el QR de registro → «Crear equipo» → nombre, equipo y código. Debe aparecer «¡Equipo creado!».
2. Móvil B: escanea un QR de punto sin registrarse → te lleva al registro → «Unirme a un equipo» → prueba un código erróneo (error visible) y luego el correcto → vuelve solo al QR y muestra «Escaneo registrado».
3. Móvil A: escanea el mismo QR → «Vuestro equipo ya había registrado este QR».
4. `/equipo` en cualquiera de los dos móviles: 2 jugadores, escaneos y actividad.
5. Ordenador: `/admin` → login → los escaneos aparecen sin recargar; prueba los filtros.
6. Telegram: debe llegar un mensaje por escaneo.
7. Escanea un QR desactivado o una URL inventada → «Aquí no hay nada…».

## 15. Pruebas realizadas en este repositorio

Ejecutadas el 30/10/2026 sobre el build de producción (`next build` + `next start`).

**No se ha probado contra un Supabase real, un bot de Telegram real ni Vercel**: no hay credenciales en este entorno. Para ejecutar el código real de la app de punta a punta se usó un **doble en memoria de la API PostgREST** (la que usa `supabase-js`). Reproduce las consultas, inserciones y restricciones de unicidad que usa la app; no reproduce RLS ni los permisos de Postgres.

- `npm run typecheck` y `npm run build`: sin errores ni avisos.
- `supabase/schema.sql` aplicado en un PostgreSQL 16 local en la versión anterior: rechaza nombres de equipo duplicados (aunque cambien las mayúsculas) y slugs no válidos. El bloque de `revoke` añadido después no se ha ejecutado contra Supabase.
- **33 comprobaciones HTTP, todas correctas**:
  - crear equipo; nombre duplicado; mismo móvil registrándose dos veces; validaciones;
  - unirse con código erróneo, correcto o con un `teamId` inválido; bloqueo tras 8 fallos;
  - escaneo válido, repetido, desconocido y con slug inválido; redirección al registro y rechazo de `next` externos;
  - pantalla de equipo; «No soy yo» (baja sin duplicados, con los escaneos conservados);
  - el panel devuelve 401 o redirige sin sesión, rechaza cookies falsificadas y contraseñas incorrectas, y da datos correctos con sesión;
  - cabeceras de seguridad y que la lista de equipos no expone códigos.
- **Prueba de interfaz con Chromium (Playwright)** a 390×844 y 1280×900:
  - crear equipo desde la portada; unirse desde un QR con código erróneo y luego correcto;
  - escaneo, pantalla de equipo y QR inválido;
  - login y panel; un escaneo nuevo aparece en el panel sin recargar;
  - filtro por jugador; crear un punto en `/admin/qr` y abrir su URL.
  - Resultado: **sin desplazamiento horizontal** en ninguna pantalla y animaciones desactivadas con `prefers-reduced-motion`. Los únicos errores de consola son los 401, 403 y 404 esperados de las pruebas negativas.
- Telegram con un token falso: la API respondió 401, se registró «Telegram respondió 401» y el registro y los escaneos continuaron con normalidad. Sin variables de Telegram, no se intenta ningún envío.

## 16. Seguridad y limitaciones conocidas

- La cookie identifica un **navegador**, no a una persona. Si se abre el QR en otro navegador o en modo incógnito, pedirá registrarse de nuevo.
- Un escaneo no prueba que la prueba se haya hecho; las evidencias van por WhatsApp.
- El código de equipo es la única credencial para unirse: hay que compartirlo solo con el equipo.
- La contraseña del panel es compartida. Es suficiente para un evento puntual; para algo permanente convendría Supabase Auth con MFA.
- Los límites de spam son por equipo y globales; no hay limitación por IP.
- Cabeceras: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin` (las URL de los QR no se filtran a otros sitios) y `Permissions-Policy` restrictiva.
- La web no se indexa (`robots: noindex`).
- Datos personales: solo nombres de pila y user agent. Borra los datos después del evento; si participan menores, informa a sus responsables.

## 17. Configuración pendiente (manual)

- [ ] Crear el proyecto de Supabase y ejecutar `supabase/schema.sql`.
- [ ] Crear el bot de Telegram y obtener el `chat_id`.
- [ ] Importar en Vercel y configurar las variables.
- [ ] Escribir los textos reales de los QR en `/admin/qr` y desactivar los de ejemplo.
- [ ] Imprimir los QR desde el dominio definitivo y hacer un ensayo con móviles reales.

## 18. Notas para quien continúe el desarrollo

- Colores y estilos están en variables de `src/app/globals.css` (`--parchment`, `--blood`, `--pumpkin`, `--gold`…). Las clases principales son `.parchment` (tarjetas), `.btn-seal` (acción principal), `.btn-wood` (secundaria), `.wax-seal` y `.panel` (admin).
- Los adornos son SVG en `src/components/ornaments.tsx`; añade nuevos ahí.
- La identidad del jugador se obtiene siempre con `getCurrentPlayer()`; la del organizador, con `isAdmin()` / `requireAdmin()`.
- Cualquier consulta nueva debe hacerse en el servidor con `db()`; no añadas políticas RLS públicas.
