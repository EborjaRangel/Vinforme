import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";
import { hashClave, sesionTransporte } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sesion = await sesionTransporte();
  if (!sesion?.esAdmin) return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  const resultado = await consultar<{ usuario: string; nombre: string; es_admin: boolean; activo: boolean }>(
    `SELECT usuario, nombre, es_admin, activo FROM usuarios_transporte ORDER BY creado_en ASC`,
  );
  return NextResponse.json({ ok: true, usuarios: resultado.rows });
}

export async function POST(request: Request) {
  const sesion = await sesionTransporte();
  if (!sesion?.esAdmin) return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }
  if (!cuerpo || typeof cuerpo !== "object") {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }
  const datos = cuerpo as { usuario?: unknown; nombre?: unknown; clave?: unknown };
  const usuario = String(datos.usuario ?? "").trim().toLowerCase();
  const nombre = String(datos.nombre ?? "").trim().replace(/\s+/g, " ");
  const clave = String(datos.clave ?? "");
  if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) {
    return NextResponse.json({ ok: false, mensaje: "El usuario debe tener entre 3 y 40 letras o números." }, { status: 400 });
  }
  if (nombre.length < 3 || clave.length < 8) {
    return NextResponse.json({ ok: false, mensaje: "El nombre y una contraseña de al menos 8 caracteres son obligatorios." }, { status: 400 });
  }

  try {
    await consultar(
      `INSERT INTO usuarios_transporte (id, usuario, nombre, clave_hash, es_admin, activo, creado_en)
       VALUES ($1, $2, $3, $4, FALSE, TRUE, NOW())`,
      [randomUUID(), usuario, nombre, hashClave(clave)],
    );
  } catch {
    return NextResponse.json({ ok: false, mensaje: "Ese usuario ya existe." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
