import { NextResponse } from "next/server";
import { cerrarSesionTransporte } from "@/lib/transporte-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await cerrarSesionTransporte();
  return NextResponse.redirect(new URL("/transporte", request.url), 303);
}
