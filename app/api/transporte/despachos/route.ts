import { NextResponse } from "next/server";
import { listarDespachos } from "@/lib/transporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await sesionTransporte())) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }
  const despachos = await listarDespachos();
  return NextResponse.json({ ok: true, despachos });
}
