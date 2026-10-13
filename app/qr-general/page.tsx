import type { Metadata } from "next";
import { DescargarQr } from "@/components/DescargarQr";
import { esOrigenLocal, origenActual } from "@/lib/origen";

export const metadata: Metadata = {
  title: "QR de invitación",
};

export const dynamic = "force-dynamic";

export default async function PaginaQrGeneral() {
  const origen = await origenActual();
  const destino = `${origen}/registro`;
  const local = esOrigenLocal(origen);

  return (
    <div className="pagina contenedor">
      <p className="kicker">Invitación</p>
      <h1>QR general</h1>
      <p className="lead">
        Este código se envía a todas las personas invitadas. En el centro dice V Informe Coyoacán y, al escanearlo, abre el
        registro para confirmar asistencia.
      </p>
      {local ? (
        <p className="aviso-local">
          Este QR apunta a {destino}. Sirve para probarlo en esta computadora. Antes de enviarlo, publica el sitio, escribe
          esa dirección en APP_URL y descarga de nuevo el código.
        </p>
      ) : (
        <p className="aviso-ok">Este QR abre: {destino}</p>
      )}
      <article className="marco-qr marco-centrado">
        <img src="/api/qr/general" alt="Código QR general con la leyenda V Informe Coyoacán" />
        <p>V Informe Coyoacán</p>
        <DescargarQr href="/api/qr/general" archivo="qr-v-informe-coyoacan" />
      </article>
    </div>
  );
}
