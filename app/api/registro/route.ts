import { NextResponse } from "next/server";
import { ValidationError } from "yup";
import { esquemaRegistro } from "@/lib/validacion";
import { telefonoDiez } from "@/lib/telefono";
import { crearInvitado, ErrorRegistro, guardarNotificacion } from "@/lib/store";
import { enviarConfirmacion } from "@/lib/notificaciones";
import { origenDesdeRequest } from "@/lib/origen";
import { ipDe, solicitudLimitada } from "@/lib/limite";
import type { ValoresRegistro } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (solicitudLimitada(ipDe(request))) {
    return NextResponse.json(
      { ok: false, mensaje: "Hay demasiados registros desde esta red. Espera unos minutos e intenta de nuevo." },
      { status: 429 },
    );
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  if (!cuerpo || typeof cuerpo !== "object") {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  const trampa = "sitioWeb" in cuerpo ? String((cuerpo as { sitioWeb?: unknown }).sitioWeb ?? "") : "";
  if (trampa.trim()) {
    return NextResponse.json({ ok: false, mensaje: "No fue posible completar el registro." }, { status: 400 });
  }

  let datos: ValoresRegistro;
  try {
    datos = (await esquemaRegistro.validate(cuerpo, {
      abortEarly: false,
      stripUnknown: true,
    })) as ValoresRegistro;
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, mensaje: error.errors[0] ?? "Revisa los datos del formulario." }, { status: 400 });
    }
    throw error;
  }

  datos.telefono = telefonoDiez(datos.telefono);

  try {
    const creado = await crearInvitado(datos);
    const notificacion = await enviarConfirmacion(creado, origenDesdeRequest(request));
    const invitado = (await guardarNotificacion(creado.id, notificacion)) ?? creado;

    return NextResponse.json({
      ok: true,
      slug: invitado.slug,
      notificacion: invitado.notificacion,
    });
  } catch (error) {
    if (error instanceof ErrorRegistro) {
      return NextResponse.json({ ok: false, mensaje: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { ok: false, mensaje: "No fue posible guardar el registro. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
