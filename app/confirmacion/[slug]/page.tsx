import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DescargarQr } from "@/components/DescargarQr";
import { tituloCompleto } from "@/lib/evento";
import { formatoFechaHora } from "@/lib/formato";
import { slugValido } from "@/lib/nombres";
import { obtenerPorSlug } from "@/lib/store";
import { formatearTelefono } from "@/lib/telefono";
import type { CanalAviso } from "@/lib/types";

export const metadata: Metadata = {
  title: "Pase personal",
};

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ slug: string }> };

export default async function PaginaConfirmacion({ params }: Contexto) {
  const { slug } = await params;
  if (!slugValido(slug)) notFound();
  const invitado = await obtenerPorSlug(slug);
  if (!invitado) notFound();

  return (
    <div className="pagina contenedor">
      <p className="kicker">Asistencia confirmada</p>
      <h1>Tu pase está listo</h1>
      <p className="lead">
        Guarda esta pantalla. El día del {tituloCompleto} presenta el código en el acceso. Al escanearlo quedará registrado
        que llegaste.
      </p>

      <div className="aviso-ok">
        <p>{textoCanal("correo", invitado.notificacion.correo, invitado.correo)}</p>
        <p>{textoCanal("sms", invitado.notificacion.sms, formatearTelefono(invitado.telefono))}</p>
      </div>

      <article className="pase">
        <span className="sello" aria-hidden="true">
          V
        </span>
        <p className="kicker">Pase personal</p>
        <h2>{invitado.nombreCompleto}</h2>
        <p>{invitado.institucion}</p>
        <img src={`/api/qr/${invitado.slug}`} alt={`Código QR personal de ${invitado.nombreCompleto}`} />
        <p className="folio">Folio: {invitado.slug}</p>
        <p className="folio">Registro: {formatoFechaHora(invitado.registradoEn)}</p>
        <p>Este pase es personal. El código se generó a partir de tu nombre.</p>
      </article>

      <div className="acciones no-imprimir pase-acciones">
        <DescargarQr href={`/api/qr/${invitado.slug}`} archivo={`pase-${invitado.slug}`} />
      </div>
      <p className="nota pase-nota">
        Para guardar el pase usa la descarga. Si lo abres desde el mensaje, conserva esta página en el celular.
      </p>
    </div>
  );
}

function textoCanal(canal: "correo" | "sms", estado: CanalAviso, destino: string) {
  const medio = canal === "correo" ? "correo" : "WhatsApp";
  if (estado === "enviado") return `Enviamos la confirmación a tu ${medio}: ${destino}.`;
  if (estado === "error") return `No se pudo enviar la confirmación a tu ${medio}. Conserva este pase en la pantalla.`;
  return `La confirmación por ${medio} todavía no está activada en el sistema. Este pase en pantalla es tu comprobante.`;
}
