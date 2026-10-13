import type { Metadata } from "next";
import Link from "next/link";
import { DescargarQr } from "@/components/DescargarQr";
import { evento, tituloCompleto } from "@/lib/evento";
import { esRedPrivada, origenActual } from "@/lib/origen";

export const metadata: Metadata = {
  title: "Inicio",
};

export const dynamic = "force-dynamic";

export default async function PaginaInicio() {
  const origen = await origenActual();
  const local = esRedPrivada(origen);
  const datos = [
    evento.fecha ? { etiqueta: "Fecha", valor: evento.fecha } : null,
    evento.hora ? { etiqueta: "Hora", valor: evento.hora } : null,
    evento.lugar ? { etiqueta: "Lugar", valor: evento.lugar } : null,
  ].filter((dato): dato is { etiqueta: string; valor: string } => Boolean(dato));

  return (
    <div className="pagina contenedor">
      {local ? (
        <p className="aviso-local">
          El QR abre el registro en la red de esta computadora. El celular tiene que usar la misma red Wi-Fi. Cuando el sitio
          tenga dirección pública, define APP_URL y vuelve a descargar el código antes de enviarlo.
        </p>
      ) : null}

      <section className="hero">
        <div>
          <p className="kicker">
            {evento.entidad} · {evento.ciudad}
          </p>
          <h1>{tituloCompleto}</h1>
          <p className="lead">
            Comparte el código general con las personas invitadas. Al escanearlo confirman su asistencia, reciben el aviso
            en su celular y en su correo, y obtienen un pase con un QR hecho a partir de su nombre.
          </p>
          <div className="acciones">
            <Link className="boton" href="/registro">
              Confirmar asistencia
            </Link>
            <Link className="boton-secundario" href="/qr-general">
              Ver QR de invitación
            </Link>
          </div>
        </div>
        <article className="marco-qr">
          <img src="/api/qr/general" alt="Código QR general del V Informe de Coyoacán" />
          <p>Este es el código que se envía a las personas invitadas.</p>
          <DescargarQr href="/api/qr/general" archivo="qr-v-informe-coyoacan" />
        </article>
      </section>

      {datos.length > 0 ? (
        <section className="seccion detalle-evento">
          {datos.map((dato) => (
            <article className="tarjeta" key={dato.etiqueta}>
              <p className="kicker">{dato.etiqueta}</p>
              <h2>{dato.valor}</h2>
            </article>
          ))}
        </section>
      ) : null}

      <section className="seccion">
        <h2>Cómo entra una persona invitada</h2>
        <div className="pasos">
          <article className="paso">
            <span>1</span>
            <h3>Recibe el QR general</h3>
            <p>El código se comparte con todas las personas convocadas y abre el registro de asistencia.</p>
          </article>
          <article className="paso">
            <span>2</span>
            <h3>Confirma sus datos</h3>
            <p>Registra nombre, apellidos, teléfono, institución o cargo y correo. El nombre completo no se puede repetir.</p>
          </article>
          <article className="paso">
            <span>3</span>
            <h3>Recibe su pase</h3>
            <p>Le llega la confirmación al celular y al correo, con un QR personal generado a partir de su nombre.</p>
          </article>
          <article className="paso">
            <span>4</span>
            <h3>Llega al evento</h3>
            <p>Al escanear su pase queda registrado el ingreso y el control muestra cuántas personas ya están dentro.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
