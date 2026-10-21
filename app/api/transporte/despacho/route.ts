import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { consultar } from "@/lib/db";
import { telefonoDiez } from "@/lib/telefono";
import { lugarDesdeCoordenadas } from "@/lib/transporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = new Set(["camion", "microbus", "van"]);
const MAX_FOTO = 3 * 1024 * 1024;

export async function POST(request: Request) {
  const sesion = await sesionTransporte();
  if (!sesion) return NextResponse.json({ ok: false, mensaje: "No autorizado." }, { status: 401 });

  let formulario: FormData;
  try {
    formulario = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, mensaje: "No se pudo leer el formulario." }, { status: 400 });
  }

  const dirigenteId = String(formulario.get("dirigenteId") ?? "");
  const tipo = String(formulario.get("tipo") ?? "");
  const placas = String(formulario.get("placas") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const choferNombre = String(formulario.get("choferNombre") ?? "").trim().replace(/\s+/g, " ");
  const choferTelefono = telefonoDiez(String(formulario.get("choferTelefono") ?? ""));
  const contactoNombre = String(formulario.get("contactoNombre") ?? "").trim().replace(/\s+/g, " ");
  const contactoTelefono = telefonoDiez(String(formulario.get("contactoTelefono") ?? ""));
  const idaVuelta = String(formulario.get("idaVuelta") ?? "") === "si";
  const lat = Number(formulario.get("lat"));
  const lng = Number(formulario.get("lng"));
  const foto = formulario.get("foto");

  if (!dirigenteId || !TIPOS.has(tipo)) {
    return NextResponse.json({ ok: false, mensaje: "Elige el dirigente y el tipo de transporte." }, { status: 400 });
  }
  if (placas.length < 5 || placas.length > 12) {
    return NextResponse.json({ ok: false, mensaje: "Escribe las placas del transporte." }, { status: 400 });
  }
  if (choferNombre.length < 3 || contactoNombre.length < 3) {
    return NextResponse.json({ ok: false, mensaje: "Escribe el nombre del chofer y el contacto del transporte." }, { status: 400 });
  }
  if (choferTelefono.length !== 10 || contactoTelefono.length !== 10) {
    return NextResponse.json({ ok: false, mensaje: "Los teléfonos deben tener 10 dígitos." }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ ok: false, mensaje: "Falta la ubicación del punto de entrega." }, { status: 400 });
  }
  if (!(foto instanceof File) || foto.size === 0) {
    return NextResponse.json({ ok: false, mensaje: "Toma la foto del transporte." }, { status: 400 });
  }
  if (!foto.type.startsWith("image/") || foto.size > MAX_FOTO) {
    return NextResponse.json({ ok: false, mensaje: "La foto debe ser una imagen de menos de 3 MB." }, { status: 400 });
  }

  const dirigente = await consultar(`SELECT id FROM dirigentes WHERE id = $1`, [dirigenteId]);
  if (!dirigente.rows[0]) {
    return NextResponse.json({ ok: false, mensaje: "Ese dirigente no está en la lista." }, { status: 404 });
  }

  const lugar = await lugarDesdeCoordenadas(lat, lng);
  const id = randomUUID();
  const bytes = Buffer.from(await foto.arrayBuffer());
  await consultar(
    `INSERT INTO despachos (
       id, dirigente_id, tipo, placas, chofer_nombre, chofer_telefono, contacto_nombre, contacto_telefono,
       ida_vuelta, lat, lng, lugar_texto, entregado_en, foto_tipo, foto, usuario_id, creado_en
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       $9, $10, $11, $12, NOW(), $13, $14, $15, NOW()
     )`,
    [
      id,
      dirigenteId,
      tipo,
      placas,
      choferNombre,
      choferTelefono,
      contactoNombre,
      contactoTelefono,
      idaVuelta,
      lat,
      lng,
      lugar,
      foto.type,
      bytes,
      sesion.id,
    ],
  );

  return NextResponse.json({ ok: true, id });
}
