import type { Metadata } from "next";
import { DescargarQr } from "@/components/DescargarQr";
import { esRedPrivada, origenActual } from "@/lib/origen";

export const metadata: Metadata = {
  title: "QR de invitación",
};

export const dynamic = "force-dynamic";

export default async function PaginaQrGeneral() {
  const origen = await origenActual();
  const destino = origen;
  const local = esRedPrivada(origen);

  return (
    <div className="pagina contenedor">
      <p className="kicker">Invitación</p>
      <h1>QR general</h1>
      <p className="lead">
        Este código se envía a todas las personas invitadas. Al escanearlo, abre la página de inicio del sitio.
      </p>
      {local ? (
        <p className="aviso-local">
          Este QR abre {destino}. El celular tiene que estar en la misma red Wi-Fi que esta computadora. Si lo vas a enviar
          fuera de esa red, publica el sitio, escribe la dirección en APP_URL y descarga de nuevo el código.
        </p>
      ) : (
        <p className="aviso-ok">Este QR abre: {destino}</p>
      )}
      <article className="marco-qr marco-centrado">
        <img src="/api/qr/general" alt="Código QR general de invitación" />
        <p>V Informe Coyoacán</p>
        <DescargarQr href="/api/qr/general" archivo="qr-v-informe-coyoacan" />
      </article>
    </div>
  );
}
