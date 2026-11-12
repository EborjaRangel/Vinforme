import { consultar } from "@/lib/db";
import { sesionTransporte } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, contexto: Contexto) {
  const sesion = await sesionTransporte();
  if (!sesion) {
    return new Response("No autorizado", { status: 401 });
  }
  const { id } = await contexto.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("No encontrado", { status: 404 });
  const resultado = await consultar<{ foto: Buffer; foto_tipo: string; usuario_id: string | null }>(
    `SELECT foto, foto_tipo, usuario_id FROM despachos WHERE id = $1`,
    [id],
  );
  if (!sesion.esAdmin && resultado.rows[0] && resultado.rows[0].usuario_id !== sesion.id) {
    return new Response("No autorizado", { status: 401 });
  }
  const fila = resultado.rows[0];
  if (!fila) return new Response("No encontrado", { status: 404 });
  const bytes = Buffer.isBuffer(fila.foto) ? fila.foto : Buffer.from(fila.foto);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": fila.foto_tipo || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
