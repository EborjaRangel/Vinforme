import type { Metadata } from "next";
import { FormularioDespacho } from "@/components/FormularioDespacho";
import { LoginTransporte } from "@/components/LoginTransporte";
import { MenuTransporte } from "@/components/MenuTransporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const metadata: Metadata = { title: "Despachar transporte" };
export const dynamic = "force-dynamic";

export default async function PaginaDespacho() {
  const sesion = await sesionTransporte();
  if (!sesion) return <LoginTransporte />;

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Registrar entrega</h1>
      <p className="lead">
        Toma la foto y la ubicación en el punto donde se entrega la unidad. Esa ubicación es el lugar de entrega.
      </p>
      <MenuTransporte activo="despacho" esAdmin={sesion.esAdmin} />
      <FormularioDespacho />
    </section>
  );
}
