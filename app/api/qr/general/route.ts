import { tituloCompleto } from "@/lib/evento";
import { origenDesdeRequest } from "@/lib/origen";
import { qrConEtiqueta, respuestaSvg } from "@/lib/qr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const destino = `${origenDesdeRequest(request)}/registro`;
  const svg = await qrConEtiqueta(destino, "V Informe", "Coyoacán", `Código de invitación · ${tituloCompleto}`);
  return respuestaSvg(svg);
}
