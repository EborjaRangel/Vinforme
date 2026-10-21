import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { consultar } from "@/lib/db";

const NOMBRE_COOKIE = "informe_transporte";
const DOCE_HORAS = 60 * 60 * 12;

export type SesionTransporte = {
  id: string;
  usuario: string;
  esAdmin: boolean;
};

function secreto() {
  return process.env.ADMIN_SECRET || "informe-coyoacan-desarrollo";
}

export function hashClave(clave: string) {
  const sal = randomBytes(16).toString("hex");
  const hash = scryptSync(clave, sal, 32).toString("hex");
  return `${sal}:${hash}`;
}

export function claveCoincide(clave: string, guardada: string) {
  const [sal, hash] = guardada.split(":");
  if (!sal || !hash) return false;
  const actual = scryptSync(clave, sal, 32);
  const esperada = Buffer.from(hash, "hex");
  if (actual.length !== esperada.length) return false;
  return timingSafeEqual(actual, esperada);
}

function firmar(sesion: SesionTransporte) {
  const expira = Date.now() + DOCE_HORAS * 1000;
  const cuerpo = `transporte.${sesion.id}.${sesion.esAdmin ? "1" : "0"}.${expira}`;
  const firma = createHmac("sha256", secreto()).update(cuerpo).digest("hex");
  return `${cuerpo}.${firma}`;
}

export function leerToken(token: string | undefined): SesionTransporte | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 5) return null;
  const [tipo, id, admin, expira, firma] = partes;
  if (tipo !== "transporte" || !id || !expira || !firma) return null;
  const cuerpo = `${tipo}.${id}.${admin}.${expira}`;
  const esperada = createHmac("sha256", secreto()).update(cuerpo).digest("hex");
  const firmaRecibida = Buffer.from(firma);
  const firmaEsperada = Buffer.from(esperada);
  if (firmaRecibida.length !== firmaEsperada.length) return null;
  if (!timingSafeEqual(firmaRecibida, firmaEsperada)) return null;
  if (Number(expira) <= Date.now()) return null;
  return { id, usuario: "", esAdmin: admin === "1" };
}

export async function sesionTransporte() {
  const almacen = await cookies();
  const token = leerToken(almacen.get(NOMBRE_COOKIE)?.value);
  if (!token) return null;
  const resultado = await consultar<{ usuario: string; es_admin: boolean; activo: boolean }>(
    `SELECT usuario, es_admin, activo FROM usuarios_transporte WHERE id = $1`,
    [token.id],
  );
  const fila = resultado.rows[0];
  if (!fila?.activo) return null;
  return { id: token.id, usuario: fila.usuario, esAdmin: fila.es_admin };
}

export async function abrirSesionTransporte(sesion: SesionTransporte) {
  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE, firmar(sesion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DOCE_HORAS,
  });
}

export async function cerrarSesionTransporte() {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE);
}
