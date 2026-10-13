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
          El QR abre la página de inicio en la red de esta computadora. El celular tiene que usar la misma red Wi-Fi. Cuando el sitio
          tenga dirección pública, define APP_URL y vuelve a descargar el código antes de enviarlo.
        </p>
      ) : null}

      <section className="hero">
        <div>
          <p className="kicker">
            {evento.entidad} · {evento.ciudad}
          </p>
          <h1>{tituloCompleto}</h1>
          <p className="mt-4 flex items-center gap-2 text-4xl leading-tight font-black text-tinta md:text-5xl">
            <svg viewBox="0 0 24 24" className="h-[0.9em] w-[0.9em] shrink-0 text-rojo" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
              />
            </svg>
            {evento.lugar}
          </p>
          <p className="mt-2 text-3xl leading-tight font-black text-black md:text-5xl">
            {evento.fecha} · {evento.hora}
          </p>
          <p className="lead">
            Comparte el código general con las personas invitadas. Al escanearlo confirman su asistencia, reciben el aviso
            por WhatsApp y por correo, y obtienen un pase con un QR hecho a partir de su nombre.
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
            <p>El código se comparte con todas las personas convocadas y abre la página de inicio.</p>
          </article>
          <article className="paso">
            <span>2</span>
            <h3>Confirma sus datos</h3>
            <p>Registra nombre, apellidos, teléfono, institución o cargo y correo. El nombre completo no se puede repetir.</p>
          </article>
          <article className="paso">
            <span>3</span>
            <h3>Recibe su pase</h3>
            <p>Le llega la confirmación por WhatsApp y por correo, con un QR personal generado a partir de su nombre.</p>
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
