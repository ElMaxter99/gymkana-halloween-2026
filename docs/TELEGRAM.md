# 🤖 Avisos por Telegram

La web puede mandar un mensaje a Telegram cada vez que alguien escanea un QR o se une a un equipo. Es **opcional**: sin configurarlo, todo funciona igual y los avisos solo se ven en el panel (`/admin`).

Necesitas dos valores: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.

## 1. Generar `TELEGRAM_BOT_TOKEN`

1. Abre Telegram.
2. Busca **@BotFather** (el bot oficial de Telegram para crear bots).
3. Entra en la conversación y escribe:

   ```
   /newbot
   ```

4. Te pedirá un **nombre** para el bot. Por ejemplo: `Gymkana Halloween Avisos`.
5. Después te pedirá un **nombre de usuario** que termine en `bot`. Por ejemplo: `gymkana_halloween_bot`.
6. BotFather te responderá con un token parecido a este:

   ```
   1234567890:AAExampleTokenxxxxxxxxxxxxxxxx
   ```

Ese es tu `TELEGRAM_BOT_TOKEN`.

> **Importante:** no compartas ese token con nadie ni lo subas al repositorio. Es como una contraseña: quien lo tenga puede escribir como tu bot. Si se filtra, en @BotFather usa `/revoke` para generar uno nuevo.

## 2. Conseguir `TELEGRAM_CHAT_ID`

### Avisos en tu chat privado

1. Busca tu nuevo bot en Telegram (por su nombre de usuario).
2. Pulsa **Iniciar** (*Start*) o envíale un mensaje cualquiera, por ejemplo `Hola`.
3. Abre este enlace en el navegador, sustituyendo `TU_TOKEN` por el token anterior:

   ```
   https://api.telegram.org/botTU_TOKEN/getUpdates
   ```

4. Verás una respuesta JSON parecida a esta:

   ```json
   {
     "message": {
       "chat": {
         "id": 123456789,
         "first_name": "Usuario"
       }
     }
   }
   ```

El número de `chat.id` es tu `TELEGRAM_CHAT_ID`.

### Avisos en un grupo (por ejemplo, con otros organizadores)

1. Crea el grupo y **añade el bot** como miembro.
2. Escribe un mensaje en el grupo mencionando al bot, por ejemplo `/start@gymkana_halloween_bot`.
3. Abre otra vez `https://api.telegram.org/botTU_TOKEN/getUpdates`.
4. Busca el `chat.id` del grupo. **Es un número negativo**, por ejemplo `-1001234567890`. Cópialo con el signo menos.

> Si `getUpdates` devuelve `"result": []`, envía otro mensaje al bot o al grupo y recarga la página.

## 3. Configurar la aplicación

### En local

En `.env.local` (copia de `.env.example`):

```bash
TELEGRAM_BOT_TOKEN=1234567890:AAExampleTokenxxxxxxxx
TELEGRAM_CHAT_ID=123456789
```

Reinicia `npm run dev` para que lea los valores nuevos.

### En Vercel

1. Proyecto → **Settings → Environment Variables**.
2. Añade `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` (entorno *Production*, y *Preview* si quieres avisos también en las vistas previas).
3. **Vuelve a desplegar** (*Deployments → Redeploy*): las variables nuevas solo se aplican en un despliegue nuevo.

No uses el prefijo `NEXT_PUBLIC_`: el token solo debe existir en el servidor.

## 4. Probar que funciona

1. Abre la web y únete a un equipo desde el móvil. Debe llegar:

   ```
   🦇 NUEVO JUGADOR
   👥 Equipo: Zombie
   🧙 Jugador: Álvaro
   ```

2. Escanea un QR (o abre su URL desde `/admin/qr`). Debe llegar:

   ```
   🎃 NUEVO ESCANEO
   👥 Equipo: Zombie
   🧙 Jugador: Álvaro
   📍 Punto: El Anfiteatro
   🕒 Hora: 22:14
   ```

   Si el equipo ya había escaneado ese QR, se añade «🔁 Repetido». Si el QR no está en su ruta (rutas marcadas en `/admin/qr`), se añade «⚠️ Este QR no está en la ruta de su equipo».

Cuando acabes las pruebas, en `/admin/partidas` pulsa «Guardar copia y empezar partida nueva» para dejarlo todo limpio.

## 5. Si no llegan los mensajes

| Síntoma en los logs (Vercel → *Logs*) | Causa probable | Solución |
|---|---|---|
| No aparece nada | Faltan las variables o no se ha vuelto a desplegar | Revisa las dos variables y despliega de nuevo |
| `Telegram respondió 401` | Token incorrecto o revocado | Copia de nuevo el token de @BotFather |
| `Telegram respondió 400` | `TELEGRAM_CHAT_ID` incorrecto | Repite el paso 2; en grupos, incluye el signo menos |
| `Telegram respondió 403` | Nunca has pulsado *Iniciar* en el bot, o lo han sacado del grupo | Escribe al bot o vuelve a añadirlo al grupo |
| `Telegram no disponible: TimeoutError` | Telegram tardó más de 5 s | Es puntual; el escaneo se guarda igualmente |

Un fallo de Telegram **nunca** impide jugar: el escaneo se guarda primero y el aviso se envía después. Por seguridad, los logs nunca incluyen el token.

## Cómo funciona por dentro

- El envío está en `src/lib/telegram.ts` (`notifyTelegram`, `scanMessage` y `joinMessage`).
- Se llama con `after()` de Next.js desde `src/app/p/[slug]/page.tsx` (escaneos) y `src/app/api/register/route.ts` (jugadores nuevos), así el jugador no espera al aviso.
- Telegram limita los envíos (unos 20 mensajes por minuto en un grupo). Si hay muchísimos escaneos seguidos, alguno puede perderse; el panel `/admin` sigue siendo la fuente de verdad.
