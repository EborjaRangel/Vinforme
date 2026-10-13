import { origenDesdeRequest } from "@/lib/origen";
import { qrLimpio, respuestaSvg } from "@/lib/qr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const destino = origenDesdeRequest(request);
  const svg = await qrLimpio(destino);
  return respuestaSvg(svg);
}
