import { NextResponse } from "next/server";
import { abrirSesionAdmin, claveAdmin, clavesIguales, usuarioAdmin } from "@/lib/auth";
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

  const usuario = cuerpo && typeof cuerpo === "object" && "usuario" in cuerpo ? String((cuerpo as { usuario?: unknown }).usuario ?? "").trim().toLowerCase() : "";
  const clave = cuerpo && typeof cuerpo === "object" && "clave" in cuerpo ? String((cuerpo as { clave?: unknown }).clave ?? "") : "";
  if (usuario !== usuarioAdmin() || !clavesIguales(clave, esperada)) {
    return NextResponse.json({ ok: false, mensaje: "El usuario o la contraseña no son correctos." }, { status: 401 });
  }

  await abrirSesionAdmin();
  return NextResponse.json({ ok: true });
}
