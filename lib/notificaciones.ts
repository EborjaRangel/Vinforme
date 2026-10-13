import nodemailer from "nodemailer";
import { tituloCompleto } from "@/lib/evento";
import { formatearTelefono, telefonoInternacional } from "@/lib/telefono";
import type { CanalAviso, Invitado, Notificacion } from "@/lib/types";

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function acortar(valor: string) {
  return valor.replace(/\s+/g, " ").trim().slice(0, 180);
}

function correoListo() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

function twilioListo() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

async function enviarCorreo(invitado: Invitado, enlacePase: string): Promise<{ estado: CanalAviso; detalle: string }> {
  if (!correoListo()) {
    return { estado: "no_configurado", detalle: "Falta SMTP_HOST, SMTP_USER, SMTP_PASS o SMTP_FROM." };
  }

  try {
    const transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const asunto = `Confirmación de asistencia · ${tituloCompleto}`;
    const texto = [
      `Hola ${invitado.nombreCompleto},`,
      "",
      `Tu asistencia al ${tituloCompleto} quedó confirmada.`,
      `Institución o cargo: ${invitado.institucion}`,
      "",
      "Abre tu pase y presenta el código QR personal en el acceso:",
      enlacePase,
      "",
      "Este pase es personal. El nombre completo no puede repetirse.",
      "",
      "Alcaldía Coyoacán",
    ].join("\n");

    const html = `
      <div style="font-family: Segoe UI, sans-serif; color: #3d4449; line-height: 1.5; border-top: 6px solid #00a0df; border-bottom: 6px solid #e91d2c; padding: 16px 0;">
        <p style="letter-spacing: .16em; text-transform: uppercase; font-size: 12px; color: #00a0df; margin: 0;">Alcaldía Coyoacán</p>
        <h1 style="font-size: 28px; margin: 8px 0 12px; color: #0077a8;">Asistencia confirmada</h1>
        <p>Hola ${escaparHtml(invitado.nombreCompleto)},</p>
        <p>Tu registro al <strong>${escaparHtml(tituloCompleto)}</strong> quedó confirmado.</p>
        <p><strong>Institución o cargo:</strong> ${escaparHtml(invitado.institucion)}</p>
        <p>Presenta este pase en el acceso. El código QR es personal y corresponde a tu nombre.</p>
        <p><a href="${escaparHtml(enlacePase)}" style="display:inline-block;background:#00a0df;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;">Abrir mi pase</a></p>
        <p style="font-size:14px;color:#5c5148;">Si el botón no abre, copia este enlace:<br>${escaparHtml(enlacePase)}</p>
      </div>
    `;

    await transporte.sendMail({
      from: process.env.SMTP_FROM,
      to: invitado.correo,
      subject: asunto,
      text: texto,
      html,
    });

    return { estado: "enviado", detalle: "" };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "No se pudo enviar el correo.";
    return { estado: "error", detalle: acortar(mensaje) };
  }
}

async function enviarSms(invitado: Invitado, enlacePase: string): Promise<{ estado: CanalAviso; detalle: string }> {
  const mensaje = `${tituloCompleto}: ${invitado.nombre}, tu asistencia está confirmada. Tu pase: ${enlacePase}`;
  const destino = telefonoInternacional(invitado.telefono);

  try {
    if (twilioListo()) {
      const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
      const token = process.env.TWILIO_AUTH_TOKEN ?? "";
      const respuesta = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: destino,
          From: process.env.TWILIO_FROM ?? "",
          Body: mensaje,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!respuesta.ok) {
        const cuerpo = await respuesta.text();
        return { estado: "error", detalle: acortar(cuerpo || "Twilio rechazó el SMS.") };
      }

      return { estado: "enviado", detalle: "" };
    }

    if (process.env.SMS_WEBHOOK_URL) {
      const respuesta = await fetch(process.env.SMS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          telefono: destino,
          mensaje,
          nombre: invitado.nombreCompleto,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!respuesta.ok) {
        const cuerpo = await respuesta.text();
        return { estado: "error", detalle: acortar(cuerpo || "El webhook de SMS rechazó el envío.") };
      }

      return { estado: "enviado", detalle: "" };
    }

    return {
      estado: "no_configurado",
      detalle: `Falta Twilio o SMS_WEBHOOK_URL. Destino previsto: ${formatearTelefono(invitado.telefono)}.`,
    };
  } catch (error) {
    const texto = error instanceof Error ? error.message : "No se pudo enviar el SMS.";
    return { estado: "error", detalle: acortar(texto) };
  }
}

export async function enviarConfirmacion(invitado: Invitado, origen: string): Promise<Notificacion> {
  const enlacePase = `${origen}/confirmacion/${invitado.slug}`;
  const [correo, sms] = await Promise.all([enviarCorreo(invitado, enlacePase), enviarSms(invitado, enlacePase)]);

  return {
    correo: correo.estado,
    sms: sms.estado,
    correoDetalle: correo.detalle,
    smsDetalle: sms.detalle,
  };
}
