import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ValidationError } from "yup";
import { consultar } from "@/lib/db";
import { hashClave, sesionTransporte } from "@/lib/transporte-auth";
import { esquemaAltaDespacho } from "@/lib/validacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sesion = await sesionTransporte();
  if (!sesion?.esAdmin) return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  const resultado = await consultar<{ usuario: string; nombre: string; es_admin: boolean; activo: boolean; clave_visible: string }>(
    `SELECT usuario, nombre, es_admin, activo, clave_visible FROM usuarios_transporte ORDER BY es_admin DESC, nombre ASC`,
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
  let usuario = "";
  let nombre = "";
  let clave = "";
  try {
    const limpio = await esquemaAltaDespacho.validate(cuerpo);
    usuario = limpio.usuario;
    nombre = limpio.nombre;
    clave = limpio.clave;
  } catch (error) {
    const mensaje = error instanceof ValidationError ? error.message : "La solicitud no es válida.";
    return NextResponse.json({ ok: false, mensaje }, { status: 400 });
  }

  try {
    await consultar(
      `INSERT INTO usuarios_transporte (id, usuario, nombre, clave_hash, es_admin, activo, creado_en, clave_visible)
       VALUES ($1, $2, $3, $4, FALSE, TRUE, NOW(), $5)`,
      [randomUUID(), usuario, nombre, hashClave(clave), clave],
    );
  } catch {
    return NextResponse.json({ ok: false, mensaje: "Ese usuario ya existe." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const sesion = await sesionTransporte();
  if (!sesion?.esAdmin) return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }
  const usuario =
    cuerpo && typeof cuerpo === "object" && "usuario" in cuerpo
      ? String((cuerpo as { usuario?: unknown }).usuario ?? "")
          .trim()
          .toLowerCase()
      : "";
  const activo =
    cuerpo && typeof cuerpo === "object" && "activo" in cuerpo ? Boolean((cuerpo as { activo?: unknown }).activo) : null;
  if (!usuario || activo === null) {
    return NextResponse.json({ ok: false, mensaje: "Indica el usuario y si queda en alta o en baja." }, { status: 400 });
  }

  const actual = await consultar<{ id: string; es_admin: boolean }>(
    `SELECT id, es_admin FROM usuarios_transporte WHERE usuario = $1`,
    [usuario],
  );
  const fila = actual.rows[0];
  if (!fila) return NextResponse.json({ ok: false, mensaje: "Ese usuario no existe." }, { status: 404 });
  if (fila.es_admin) {
    return NextResponse.json({ ok: false, mensaje: "El administrador no se puede dar de baja." }, { status: 400 });
  }
  if (fila.id === sesion.id) {
    return NextResponse.json({ ok: false, mensaje: "No puedes darte de baja a ti mismo." }, { status: 400 });
  }

  await consultar(`UPDATE usuarios_transporte SET activo = $2 WHERE id = $1`, [fila.id, activo]);
  return NextResponse.json({ ok: true });
}
