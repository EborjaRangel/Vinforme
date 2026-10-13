import { NextResponse } from "next/server";
import { claveAdmin, clavesIguales, haySesionAdmin } from "@/lib/auth";
import { ipDe, solicitudLimitada } from "@/lib/limite";
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

  const sesion = await haySesionAdmin();

  if (accion === "revertir" && !sesion) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }

  if (accion === "llegada" && !sesion) {
    const clave = "clave" in cuerpo ? String((cuerpo as { clave?: unknown }).clave ?? "") : "";
    const esperada = claveAdmin();
    if (!esperada || !clavesIguales(clave, esperada)) {
      if (solicitudLimitada(`checkin-clave:${ipDe(request)}`, 8, 15 * 60 * 1000)) {
        return NextResponse.json(
          { ok: false, mensaje: "Demasiados intentos. Espera unos minutos." },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { ok: false, mensaje: "La clave no es correcta. Solo el personal autorizado puede registrar la llegada." },
        { status: 401 },
      );
    }
  }

  const resultado = await marcarAsistencia(slug, accion);
  if (!resultado) {
    return NextResponse.json({ ok: false, mensaje: "No hay una persona registrada con ese código." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...resultado });
}
