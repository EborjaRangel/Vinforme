import type { Metadata } from "next";
import { LoginTransporte } from "@/components/LoginTransporte";
import { MapaTransporteCarga } from "@/components/MapaTransporteCarga";
import { MenuTransporte } from "@/components/MenuTransporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const metadata: Metadata = { title: "Mapa de transporte" };
export const dynamic = "force-dynamic";

export default async function PaginaMapa() {
  const sesion = await sesionTransporte();
  if (!sesion) return <LoginTransporte />;

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Mapa de entregas</h1>
      <p className="lead">Cada punto es el lugar y la hora en que se entregó una unidad, y el dirigente al que se asignó.</p>
      <MenuTransporte activo="mapa" esAdmin={sesion.esAdmin} />
      <MapaTransporteCarga />
    </section>
  );
}
