import { NextResponse } from "next/server";
import { ValidationError } from "yup";
import { esquemaRecuperacion } from "@/lib/validacion";
import { claveDeNombre } from "@/lib/nombres";
import { buscarPorIdentidad, guardarNotificacion } from "@/lib/store";
import { enviarConfirmacion } from "@/lib/notificaciones";
import { origenDesdeRequest } from "@/lib/origen";
import { ipDe, solicitudLimitada } from "@/lib/limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (solicitudLimitada(`recuperar:${ipDe(request)}`, 30)) {
    return NextResponse.json({ ok: false, mensaje: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "La solicitud no es válida." }, { status: 400 });
  }

  try {
    const datos = await esquemaRecuperacion.validate(cuerpo, { abortEarly: false, stripUnknown: true });
    const clave = claveDeNombre(datos.nombre, datos.primerApellido, datos.segundoApellido);
    const invitado = await buscarPorIdentidad(clave, datos.correo);

    if (!invitado) {
      return NextResponse.json(
        { ok: false, mensaje: "No encontramos un registro con ese nombre completo y ese correo." },
        { status: 404 },
      );
    }

    const notificacion = await enviarConfirmacion(invitado, origenDesdeRequest(request));
    await guardarNotificacion(invitado.id, notificacion);

    return NextResponse.json({ ok: true, slug: invitado.slug, notificacion });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, mensaje: error.errors[0] ?? "Revisa los datos." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, mensaje: "No fue posible recuperar el pase." }, { status: 500 });
  }
}
