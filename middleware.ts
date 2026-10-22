import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "informe_transporte";
const COOKIE_PASO = "informe_transporte_paso";

function borrarCookie(respuesta: NextResponse, nombre: string) {
  respuesta.cookies.set({
    name: nombre,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function vieneDelModulo(request: NextRequest) {
  const actual = request.headers.get("next-url") ?? "";
  if (actual.startsWith("/transporte")) return true;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    const url = new URL(referer);
    return url.origin === request.nextUrl.origin && url.pathname.startsWith("/transporte");
  } catch {
    return false;
  }
}

function esPrefetch(request: NextRequest) {
  const proposito = `${request.headers.get("purpose") ?? ""} ${request.headers.get("sec-purpose") ?? ""}`;
  return proposito.includes("prefetch") || request.headers.get("next-router-prefetch") === "1";
}

export function middleware(request: NextRequest) {
  if (esPrefetch(request)) return NextResponse.next();
  if (request.cookies.get(COOKIE_PASO)?.value === "1") {
    const respuesta = NextResponse.next();
    borrarCookie(respuesta, COOKIE_PASO);
    return respuesta;
  }
  if (vieneDelModulo(request)) return NextResponse.next();

  const encabezados = new Headers(request.headers);
  encabezados.set("x-transporte-nueva-entrada", "1");
  const respuesta = NextResponse.next({ request: { headers: encabezados } });
  borrarCookie(respuesta, COOKIE);
  borrarCookie(respuesta, COOKIE_PASO);
  return respuesta;
}

export const config = {
  matcher: ["/transporte", "/transporte/:path*"],
};
