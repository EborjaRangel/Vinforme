import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EstadoLlegada } from "@/components/EstadoLlegada";
import { slugValido } from "@/lib/nombres";
import { obtenerPorSlug } from "@/lib/store";

export const metadata: Metadata = {
  title: "Ingreso",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ slug: string }> };

export default async function PaginaLlegada({ params }: Contexto) {
  const { slug } = await params;
  if (!slugValido(slug)) notFound();
  const invitado = await obtenerPorSlug(slug);
  if (!invitado) notFound();

  return (
    <div className="pagina contenedor llegada">
      <p className="kicker">Control de acceso · V Informe de Coyoacán</p>
      <h1>{invitado.nombreCompleto}</h1>
      <p className="lead lead-centro">
        {invitado.institucion}
      </p>
      <EstadoLlegada slug={invitado.slug} llegadaInicial={invitado.llegadaEn} />
    </div>
  );
}
