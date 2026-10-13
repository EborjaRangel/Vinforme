import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const NOMBRE_COOKIE = "informe_admin";
const DOCE_HORAS = 60 * 60 * 12;

function secreto() {
  return process.env.ADMIN_SECRET || "informe-coyoacan-desarrollo";
}

export function claveAdmin() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "production") return "coyoacan-informe";
  return "";
}

export function clavesIguales(recibida: string, esperada: string) {
  const izquierda = createHash("sha256").update(recibida).digest();
  const derecha = createHash("sha256").update(esperada).digest();
  return timingSafeEqual(izquierda, derecha);
}

export function firmarSesion() {
  const expira = Date.now() + DOCE_HORAS * 1000;
  const cuerpo = `admin.${expira}`;
  const firma = createHmac("sha256", secreto()).update(cuerpo).digest("hex");
  return `${cuerpo}.${firma}`;
}

export function sesionValida(token: string | undefined) {
  if (!token) return false;
  const partes = token.split(".");
  if (partes.length !== 3) return false;
  const [valor, expira, firma] = partes;
  if (!valor || !expira || !firma) return false;

  const cuerpo = `${valor}.${expira}`;
  const esperada = createHmac("sha256", secreto()).update(cuerpo).digest("hex");
  const firmaRecibida = Buffer.from(firma);
  const firmaEsperada = Buffer.from(esperada);
  if (firmaRecibida.length !== firmaEsperada.length) return false;
  if (!timingSafeEqual(firmaRecibida, firmaEsperada)) return false;
  if (valor !== "admin") return false;
  return Number(expira) > Date.now();
}

export async function haySesionAdmin() {
  const almacen = await cookies();
  return sesionValida(almacen.get(NOMBRE_COOKIE)?.value);
}

export async function abrirSesionAdmin() {
  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE, firmarSesion(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DOCE_HORAS,
  });
}

export async function cerrarSesionAdmin() {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE);
}

export function mensajeriaConfigurada() {
  const correo = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
  const sms = Boolean(
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) || process.env.SMS_WEBHOOK_URL,
  );
  return { correo, sms };
}
