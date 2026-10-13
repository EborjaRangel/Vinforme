import { NextResponse } from "next/server";
import { haySesionAdmin } from "@/lib/auth";
import { slugValido } from "@/lib/nombres";
import { marcarAsistencia } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  if (!cuerpo || typeof cuerpo !== "object") {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  const slug = "slug" in cuerpo ? String((cuerpo as { slug?: unknown }).slug ?? "") : "";
  const accion = "accion" in cuerpo ? String((cuerpo as { accion?: unknown }).accion ?? "") : "";

  if (!slugValido(slug)) {
    return NextResponse.json({ ok: false, mensaje: "El código del pase no es válido." }, { status: 400 });
  }

  if (accion !== "llegada" && accion !== "revertir") {
    return NextResponse.json({ ok: false, mensaje: "La acción no es válida." }, { status: 400 });
  }

  if (accion === "revertir" && !(await haySesionAdmin())) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }

  const resultado = await marcarAsistencia(slug, accion);
  if (!resultado) {
    return NextResponse.json({ ok: false, mensaje: "No hay una persona registrada con ese código." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...resultado });
}
