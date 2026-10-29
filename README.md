# 🎃 Gymkana Halloween 2026

Mini web para la gymkana: los jugadores se registran (crean equipo o se unen a uno con su código), y cada vez que escanean un QR escondido la web les enseña la prueba **diciéndoles de qué equipo son**, y al coordinador le llega el aviso (panel en directo + Telegram).

La web **no** gestiona pruebas, fotos ni puntuaciones: las evidencias van por WhatsApp.

## Rutas

| Ruta | Quién | Qué hace |
|---|---|---|
| `/registro` | Jugadores (QR general) | Crear equipo o unirse a uno (lista + código) |
| `/p/<slug>` | Jugadores (QR escondidos) | Muestra «sois el equipo X» + instrucciones y guarda el escaneo |
| `/` | Jugadores | Muestra con qué jugador/equipo está identificado el móvil |
| `/admin` | Coordinador | Contadores, progreso equipo × QR, últimos escaneos, equipos y jugadores (refresco cada 5 s) |
| `/admin/qr` | Coordinador | Crear/editar/desactivar puntos QR e imprimir los códigos QR |

Si alguien escanea un QR sin estar registrado, se le manda a `/registro` y al terminar vuelve automáticamente al QR (y ahí se registra el escaneo).

## Puesta en marcha

1. **Supabase**: crea un proyecto y ejecuta `supabase/schema.sql` en *SQL Editor*. Crea las tablas (con RLS activado y sin políticas: solo el servidor accede) y 3 QR de ejemplo.
2. **Variables**: copia `.env.example` a `.env.local` y rellénalas.
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: *Project Settings → API*.
   - `ADMIN_PASSWORD`: contraseña del panel.
   - `ADMIN_SESSION_SECRET`: `openssl rand -base64 48`.
   - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` (opcional, ver abajo).
3. `npm install` y `npm run dev` → http://localhost:3000
4. **Vercel**: importa el repo, añade las mismas variables de entorno y despliega.
5. Entra en `/admin/qr` **desde el dominio definitivo** e imprime los QR (las URLs se generan con el dominio desde el que abres la página).

### Telegram

1. Habla con [@BotFather](https://t.me/BotFather) → `/newbot` → copia el token.
2. Escribe cualquier cosa a tu bot (o añádelo a un grupo).
3. Abre `https://api.telegram.org/bot<TOKEN>/getUpdates` y copia `chat.id`.
4. Pon ambos valores en las variables de entorno.

Avisos que llegan: alguien crea un equipo, alguien se une a un equipo y cada escaneo de QR. Si Telegram falla, el escaneo queda guardado igualmente.

## Cómo funciona por dentro

- **Identidad**: al registrarse, el móvil recibe una cookie `httpOnly` con un token aleatorio (30 días). En la BD solo se guarda su hash.
- **Código de equipo**: se guarda con `scrypt` + sal. Tras 8 fallos seguidos el equipo se bloquea 5 minutos para evitar que se adivine. No distingue mayúsculas.
- **Escaneos**: cada apertura de `/p/<slug>` guarda un evento con hora del servidor (las recargas también cuentan; el panel enseña la hora del primer escaneo y el total).
- **Panel**: sesión con cookie firmada (HMAC, 12 h). Todas las rutas y acciones de admin comprueban la sesión.

## Incidencias típicas

- **Un jugador borra cookies / cambia de móvil**: vuelve a `/registro` y se une otra vez con el código del equipo.
- **Alguien se equivoca de equipo**: en `/registro` pulsa «No soy yo / cambiar de equipo» y se registra de nuevo.
- **Desactivar un QR**: `/admin/qr` → editar → quitar «Activo». La URL mostrará «no existe».

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run typecheck` — comprobación de tipos
