import { NextResponse } from "next/server";
import { abrirSesionAdmin, claveAdmin, clavesIguales } from "@/lib/auth";
import { ipDe, solicitudLimitada } from "@/lib/limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (solicitudLimitada(`login:${ipDe(request)}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensaje: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  const esperada = claveAdmin();
  if (!esperada) {
    return NextResponse.json({ ok: false, mensaje: "El control de acceso no tiene clave configurada." }, { status: 500 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  const clave = cuerpo && typeof cuerpo === "object" && "clave" in cuerpo ? String((cuerpo as { clave?: unknown }).clave ?? "") : "";
  if (!clavesIguales(clave, esperada)) {
    return NextResponse.json({ ok: false, mensaje: "La clave de acceso no es correcta." }, { status: 401 });
  }

  await abrirSesionAdmin();
  return NextResponse.json({ ok: true });
}
