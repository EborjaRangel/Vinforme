import { NextResponse } from "next/server";
import { haySesionAdmin, mensajeriaConfigurada } from "@/lib/auth";
import { listarInvitados } from "@/lib/store";
import { resumir } from "@/lib/resumen";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await haySesionAdmin())) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }

  const invitados = await listarInvitados();
  return NextResponse.json({
    ok: true,
    invitados,
    resumen: resumir(invitados),
    mensajeria: mensajeriaConfigurada(),
  });
}
