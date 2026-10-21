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
      `INSERT INTO usuarios_transporte (id, usuario, nombre, clave_hash, es_admin, activo, creado_en)
       VALUES ($1, $2, $3, $4, FALSE, TRUE, NOW())`,
      [randomUUID(), usuario, nombre, hashClave(clave)],
    );
  } catch {
    return NextResponse.json({ ok: false, mensaje: "Ese usuario ya existe." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
