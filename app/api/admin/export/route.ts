import { NextResponse } from "next/server";
import { haySesionAdmin } from "@/lib/auth";
import { formatoFechaHora } from "@/lib/formato";
import { formatearTelefono } from "@/lib/telefono";
import { listarInvitados } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function campo(valor: string) {
  return `"${valor.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await haySesionAdmin())) {
    return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });
  }

  const invitados = await listarInvitados();
  const encabezado = [
    "Nombre",
    "Primer apellido",
    "Segundo apellido",
    "Teléfono",
    "Institución, gobierno, puesto o cargo",
    "Correo electrónico",
    "Registro",
    "En el evento",
    "Hora de ingreso",
  ];

  const filas = invitados.map((persona) =>
    [
      persona.nombre,
      persona.primerApellido,
      persona.segundoApellido,
      formatearTelefono(persona.telefono),
      persona.institucion,
      persona.correo,
      formatoFechaHora(persona.registradoEn),
      persona.llego ? "Sí" : "No",
      formatoFechaHora(persona.llegadaEn),
    ]
      .map(campo)
      .join(";"),
  );

  const csv = `\uFEFF${encabezado.map(campo).join(";")}\n${filas.join("\n")}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=asistencia-v-informe-coyoacan.csv",
      "Cache-Control": "no-store",
    },
  });
}
