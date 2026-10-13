import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EscanerAcceso } from "@/components/EscanerAcceso";
import { haySesionAdmin } from "@/lib/auth";
import { listarInvitados } from "@/lib/store";

export const metadata: Metadata = {
  title: "Escanear pases",
};

export const dynamic = "force-dynamic";

export default async function PaginaEscaner() {
  if (!(await haySesionAdmin())) redirect("/admin");
  const invitados = await listarInvitados();
  return <EscanerAcceso iniciales={invitados} />;
}
