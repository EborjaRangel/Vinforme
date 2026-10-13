import { corto, slugValido } from "@/lib/nombres";
import { origenDesdeRequest } from "@/lib/origen";
import { qrConEtiqueta, respuestaSvg } from "@/lib/qr";
import { obtenerPorSlug } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ slug: string }> };

export async function GET(request: Request, contexto: Contexto) {
  const { slug } = await contexto.params;
  if (!slugValido(slug)) {
    return new Response("Código no válido", { status: 400 });
  }

  const invitado = await obtenerPorSlug(slug);
  if (!invitado) {
    return new Response("Pase no encontrado", { status: 404 });
  }

  const destino = `${origenDesdeRequest(request)}/llegada/${invitado.slug}`;
  const svg = await qrConEtiqueta(
    destino,
    corto(invitado.nombre, 16),
    corto(invitado.primerApellido, 16),
    `Pase de ${invitado.nombreCompleto}`,
  );
  return respuestaSvg(svg);
}
