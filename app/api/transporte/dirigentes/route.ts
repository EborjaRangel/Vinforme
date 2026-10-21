import { NextResponse } from "next/server";
import { listarDirigentes, sincronizarDirigentes } from "@/lib/transporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await sesionTransporte())) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }
  const sync = await sincronizarDirigentes(false).catch((error: unknown) => ({
    ok: false as const,
    motivo: error instanceof Error ? error.message : "No se pudo actualizar la lista.",
  }));
  const dirigentes = await listarDirigentes();
  return NextResponse.json({
    ok: true,
    dirigentes,
    aviso: sync.ok ? "" : sync.motivo,
  });
}

export async function POST() {
  if (!(await sesionTransporte())) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }
  const resultado = await sincronizarDirigentes(true);
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, mensaje: resultado.motivo }, { status: 500 });
  }
  const dirigentes = await listarDirigentes();
  return NextResponse.json({ ok: true, total: dirigentes.length, dirigentes });
}
