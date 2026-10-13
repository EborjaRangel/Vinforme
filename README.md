# V Informe de Gobierno de Coyoacán

Sistema para invitar, confirmar asistencia y registrar el ingreso al V Informe de Gobierno de la Alcaldía Coyoacán.

## Qué hace

1. Genera un **QR general** con la leyenda **V Informe Coyoacán** en el centro. Ese código se envía a las personas invitadas.
2. Al escanearlo abre el registro. Pide nombre, primer apellido, segundo apellido, teléfono, institución o cargo y correo.
3. El nombre completo no se puede repetir. Con ese nombre se crea el **QR personal**.
4. La persona recibe la confirmación en el celular y en el correo, con el enlace a su pase.
5. En el acceso se escanea el QR personal y el control de acceso muestra quién ya llegó y cuántas personas hay en el evento.

El QR del mensaje abre el pase para mostrarlo. El QR impreso en el pase, al escanearse en la puerta, registra la llegada.

## Arranque

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

La clave inicial del control de acceso es `coyoacan-informe`. Está en `.env.local`. Cámbiala antes de publicar el sitio.

## Fecha, hora y lugar

Edita `lib/evento.ts`. Si dejas fecha, hora o lugar vacíos, la portada no muestra esos datos.

## Correo y SMS

Sin configuración el registro y el pase funcionan, pero el aviso no sale del servidor. Para enviarlo, completa `.env.local` a partir de `.env.example`.

Correo, con una contraseña de aplicación:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=contraseña-de-aplicacion
SMTP_FROM="V Informe Coyoacán <tu-correo@gmail.com>"
```

SMS con Twilio:

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

El número de destino se forma con `+52` y los 10 dígitos capturados. Si usas otro proveedor, define `SMS_WEBHOOK_URL`. El sistema le envía `{ telefono, mensaje, nombre }`.

## Publicar el QR

Los registros se guardan en `data/invitados.json`. Ejecuta el sistema en una sola computadora o servidor, con `npm run build` y `npm start`.

Cuando ya tenga dirección pública, escribe en `.env.local`:

```
APP_URL=https://tu-dominio.gob.mx
```

Después descarga otra vez el QR general desde **QR de invitación** y envía ese archivo. Si lo descargas en localhost, el código solo abrirá el registro en esa computadora.

## Día del evento

1. Entra a **Control de acceso**.
2. Abre **Escanear pases** en el dispositivo de la puerta, o escanea el QR del celular de cada persona con la cámara.
3. El número grande es la cantidad de personas que ya están en el evento.
4. Desde el mismo control puedes deshacer un ingreso, reenviar el aviso o descargar la lista en CSV.
