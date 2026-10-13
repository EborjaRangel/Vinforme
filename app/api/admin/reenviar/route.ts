import { NextResponse } from "next/server";
import { haySesionAdmin } from "@/lib/auth";
import { enviarConfirmacion } from "@/lib/notificaciones";
import { origenDesdeRequest } from "@/lib/origen";
import { guardarNotificacion, obtenerPorSlug } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await haySesionAdmin())) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  const slug = cuerpo && typeof cuerpo === "object" && "slug" in cuerpo ? String((cuerpo as { slug?: unknown }).slug ?? "") : "";
  const invitado = slug ? await obtenerPorSlug(slug) : null;
  if (!invitado) {
    return NextResponse.json({ ok: false, mensaje: "No encontramos a esa persona." }, { status: 404 });
  }

  const notificacion = await enviarConfirmacion(invitado, origenDesdeRequest(request));
  const actualizado = await guardarNotificacion(invitado.id, notificacion);

  return NextResponse.json({ ok: true, invitado: actualizado, notificacion });
}
