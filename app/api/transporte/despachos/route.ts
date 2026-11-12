import { NextResponse } from "next/server";
import { listarDespachos } from "@/lib/transporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sesion = await sesionTransporte();
  if (!sesion) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }
  const despachos = await listarDespachos(sesion.esAdmin ? undefined : sesion.id);
  return NextResponse.json({ ok: true, esAdmin: sesion.esAdmin, despachos });
}
