import { redirect } from "next/navigation";
import { AltaDespacho } from "@/components/AltaDespacho";
import { LoginTransporte } from "@/components/LoginTransporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const dynamic = "force-dynamic";

export default async function PaginaUsuarios() {
  const sesion = await sesionTransporte();
  if (!sesion) return <LoginTransporte />;
  if (!sesion.esAdmin) redirect("/transporte");
  return <AltaDespacho />;
}
