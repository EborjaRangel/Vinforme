import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";
import { ipDe, solicitudLimitada } from "@/lib/limite";
import { asegurarUsuarioInicial } from "@/lib/transporte";
import { abrirSesionTransporte, claveCoincide } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (solicitudLimitada(`transporte-login:${ipDe(request)}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensaje: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  const usuario =
    cuerpo && typeof cuerpo === "object" && "usuario" in cuerpo
      ? String((cuerpo as { usuario?: unknown }).usuario ?? "").trim().toLowerCase()
      : "";
  const clave =
    cuerpo && typeof cuerpo === "object" && "clave" in cuerpo
      ? String((cuerpo as { clave?: unknown }).clave ?? "")
      : "";

  await asegurarUsuarioInicial();
  const resultado = await consultar<{ id: string; clave_hash: string; es_admin: boolean; activo: boolean }>(
    `SELECT id, clave_hash, es_admin, activo FROM usuarios_transporte WHERE usuario = $1`,
    [usuario],
  );
  const fila = resultado.rows[0];
  if (!fila || !fila.activo || !claveCoincide(clave, fila.clave_hash)) {
    return NextResponse.json({ ok: false, mensaje: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  await abrirSesionTransporte({ id: fila.id, usuario, esAdmin: fila.es_admin });
  return NextResponse.json({ ok: true });
}
