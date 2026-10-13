import type { Metadata } from "next";
import { LoginAdmin } from "@/components/LoginAdmin";
import { PanelAdmin } from "@/components/PanelAdmin";
import { haySesionAdmin, mensajeriaConfigurada } from "@/lib/auth";
import { listarInvitados } from "@/lib/store";

export const metadata: Metadata = {
  title: "Control de acceso",
};

export const dynamic = "force-dynamic";

export default async function PaginaAdmin() {
  const sesion = await haySesionAdmin();
  if (!sesion) return <LoginAdmin ayuda={process.env.NODE_ENV !== "production"} />;

  const invitados = await listarInvitados();
  return <PanelAdmin iniciales={invitados} mensajeria={mensajeriaConfigurada()} />;
}
