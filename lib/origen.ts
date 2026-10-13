import os from "os";
import { headers } from "next/headers";

function normalizar(url: string) {
  return url.replace(/\/$/, "");
}

export function esOrigenLocal(origen: string) {
  return /localhost|127\.0\.0\.1/i.test(origen);
}

export function esRedPrivada(origen: string) {
  return esOrigenLocal(origen) || /https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(origen);
}

function ipDeLaRed() {
  const candidatos: string[] = [];
  for (const [nombre, lista] of Object.entries(os.networkInterfaces())) {
    if (/virtual|vmware|vbox|hyper-v|wsl|docker|loopback|bluetooth/i.test(nombre)) continue;
    for (const red of lista ?? []) {
      const esIp4 = red.family === "IPv4" || String(red.family) === "4";
      if (!esIp4 || red.internal) continue;
      candidatos.push(red.address);
    }
  }
  return (
    candidatos.find((ip) => ip.startsWith("192.168.")) ??
    candidatos.find((ip) => ip.startsWith("10.")) ??
    candidatos[0] ??
    null
  );
}

function alcanzableDesdeOtroDispositivo(origen: string) {
  if (process.env.APP_URL) return normalizar(process.env.APP_URL);
  if (!esOrigenLocal(origen)) return origen;
  const ip = ipDeLaRed();
  if (!ip) return origen;
  const url = new URL(origen);
  const puerto = url.port ? `:${url.port}` : "";
  return `http://${ip}${puerto}`;
}

export function origenDesdeRequest(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return alcanzableDesdeOtroDispositivo(`${proto}://${host}`);
}

export async function origenActual() {
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "localhost:3000";
  const proto = cabeceras.get("x-forwarded-proto") ?? (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return alcanzableDesdeOtroDispositivo(`${proto}://${host}`);
}
