import { headers } from "next/headers";

function normalizar(url: string) {
  return url.replace(/\/$/, "");
}

export function esOrigenLocal(origen: string) {
  return /localhost|127\.0\.0\.1/i.test(origen);
}

export function origenDesdeRequest(request: Request) {
  if (process.env.APP_URL) return normalizar(process.env.APP_URL);
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function origenActual() {
  if (process.env.APP_URL) return normalizar(process.env.APP_URL);
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "localhost:3000";
  const proto = cabeceras.get("x-forwarded-proto") ?? (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
