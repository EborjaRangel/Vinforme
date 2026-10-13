"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatoFechaHora } from "@/lib/formato";
import { sinAcentos } from "@/lib/nombres";
import { resumir } from "@/lib/resumen";
import { formatearTelefono } from "@/lib/telefono";
import type { CanalAviso, Invitado } from "@/lib/types";

type Filtro = "todos" | "dentro" | "pendientes";

export function PanelAdmin({
  iniciales,
  mensajeria,
}: {
  iniciales: Invitado[];
  mensajeria: { correo: boolean; sms: boolean };
}) {
  const router = useRouter();
  const [invitados, setInvitados] = useState(iniciales);
  const [consulta, setConsulta] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ocupado, setOcupado] = useState("");
  const [aviso, setAviso] = useState("");
  const [actualizado, setActualizado] = useState<Date | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const respuesta = await fetch("/api/invitados", { cache: "no-store" });
      if (respuesta.status === 401) {
        router.refresh();
        return;
      }
      if (!respuesta.ok || !activo) return;
      const datos = (await respuesta.json()) as { invitados: Invitado[] };
      setInvitados(datos.invitados);
      setActualizado(new Date());
    }

    void cargar();
    const id = window.setInterval(() => void cargar(), 4000);
    return () => {
      activo = false;
      window.clearInterval(id);
    };
  }, [router]);

  const resumen = resumir(invitados);
  const visibles = useMemo(() => {
    const q = sinAcentos(consulta.trim());
    return [...invitados]
      .filter((persona) => {
        if (filtro === "dentro" && !persona.llego) return false;
        if (filtro === "pendientes" && persona.llego) return false;
        if (!q) return true;
        const texto = sinAcentos(
          [persona.nombreCompleto, persona.institucion, persona.correo, persona.telefono, persona.slug].join(" "),
        );
        return texto.includes(q);
      })
      .sort((a, b) => {
        if (a.llego !== b.llego) return a.llego ? -1 : 1;
        if (a.llego && b.llego) return (b.llegadaEn ?? "").localeCompare(a.llegadaEn ?? "");
        return a.nombreCompleto.localeCompare(b.nombreCompleto, "es");
      });
  }, [consulta, filtro, invitados]);

  async function cambiar(slug: string, accion: "llegada" | "revertir") {
    if (accion === "revertir" && !window.confirm("¿Quitas el ingreso de esta persona?")) return;
    setOcupado(`${accion}:${slug}`);
    setAviso("");
    try {
      const respuesta = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, accion }),
      });
      const datos = (await respuesta.json()) as { mensaje?: string; invitado?: Invitado };
      if (!respuesta.ok || !datos.invitado) {
        setAviso(datos.mensaje ?? "No se pudo actualizar el ingreso.");
        return;
      }
      setInvitados((actual) => actual.map((persona) => (persona.slug === slug ? datos.invitado ?? persona : persona)));
    } finally {
      setOcupado("");
    }
  }

  async function reenviar(slug: string) {
    setOcupado(`aviso:${slug}`);
    setAviso("");
    try {
      const respuesta = await fetch("/api/admin/reenviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const datos = (await respuesta.json()) as { mensaje?: string; invitado?: Invitado };
      if (!respuesta.ok || !datos.invitado) {
        setAviso(datos.mensaje ?? "No se pudo reenviar la confirmación.");
        return;
      }
      setInvitados((actual) => actual.map((persona) => (persona.slug === slug ? datos.invitado ?? persona : persona)));
      setAviso(`Se procesó el reenvío de ${datos.invitado.nombreCompleto}.`);
    } finally {
      setOcupado("");
    }
  }

  async function salir() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <section className="pagina contenedor">
      <p className="kicker">V Informe de Gobierno · Coyoacán</p>
      <h1>Control de acceso</h1>
      <p className="lead">
        El número principal es la gente que ya ingresó.
        {actualizado
          ? ` Lista actualizada a las ${actualizado.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}.`
          : " La lista se actualiza sola."}
      </p>

      {!mensajeria.correo || !mensajeria.sms ? (
        <p className="aviso-local">
          {!mensajeria.correo ? "El correo aún no está configurado. " : "El correo está listo. "}
          {!mensajeria.sms ? "WhatsApp aún no está configurado. " : "WhatsApp está listo. "}
          Completa Twilio en Vercel para que la confirmación llegue por WhatsApp y por correo.
        </p>
      ) : (
        <p className="aviso-ok">El correo y WhatsApp están configurados. Las confirmaciones se envían al registrarse.</p>
      )}

      <div className="metricas" aria-live="polite">
        <article className="metrica metrica-principal">
          <strong>{resumen.enEvento}</strong>
          <p>Personas en el evento</p>
        </article>
        <article className="metrica">
          <strong>{resumen.registrados}</strong>
          <p>Confirmaron asistencia</p>
        </article>
        <article className="metrica">
          <strong>{resumen.porLlegar}</strong>
          <p>Por llegar</p>
        </article>
      </div>

      <div className="barra-herramientas">
        <label className="buscador">
          <span className="kicker">Buscar</span>
          <input
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            placeholder="Nombre, institución, correo o teléfono"
          />
        </label>
        <div className="filtros" role="group" aria-label="Filtrar lista">
          <button className="boton-pequeno" type="button" aria-pressed={filtro === "todos"} onClick={() => setFiltro("todos")}>
            Todas
          </button>
          <button className="boton-pequeno" type="button" aria-pressed={filtro === "dentro"} onClick={() => setFiltro("dentro")}>
            En el evento
          </button>
          <button
            className="boton-pequeno"
            type="button"
            aria-pressed={filtro === "pendientes"}
            onClick={() => setFiltro("pendientes")}
          >
            Por llegar
          </button>
        </div>
        <Link className="boton" href="/admin/escaner">
          Escanear pases
        </Link>
        <a className="boton-secundario" href="/api/admin/export">
          Descargar lista
        </a>
        <button className="boton-secundario" type="button" onClick={() => void salir()}>
          Cerrar sesión
        </button>
      </div>

      {aviso ? <p className="aviso-ok">{aviso}</p> : null}

      {visibles.length === 0 ? (
        <p className="tarjeta">No hay personas para mostrar con este filtro.</p>
      ) : (
        <>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Contacto</th>
                  <th>Institución o cargo</th>
                  <th>Ingreso</th>
                  <th>Avisos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((persona) => (
                  <tr key={persona.id}>
                    <td>
                      <strong>{persona.nombreCompleto}</strong>
                      <div className="folio">{persona.slug}</div>
                    </td>
                    <td>
                      {formatearTelefono(persona.telefono)}
                      <br />
                      {persona.correo}
                    </td>
                    <td>{persona.institucion}</td>
                    <td>
                      <span className={persona.llego ? "estado estado-ok" : "estado"}>
                        {persona.llego ? "Ya llegó" : "Por llegar"}
                      </span>
                      <div className="folio">{formatoFechaHora(persona.llegadaEn)}</div>
                    </td>
                    <td>
                      Correo: {textoCanal(persona.notificacion.correo)}
                      <br />
                      WhatsApp: {textoCanal(persona.notificacion.sms)}
                    </td>
                    <td>
                      <Acciones
                        persona={persona}
                        ocupado={ocupado}
                        onCambiar={cambiar}
                        onReenviar={reenviar}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tarjetas-persona">
            {visibles.map((persona) => (
              <article className="persona" key={persona.id}>
                <span className={persona.llego ? "estado estado-ok" : "estado"}>{persona.llego ? "Ya llegó" : "Por llegar"}</span>
                <h3>{persona.nombreCompleto}</h3>
                <p>{persona.institucion}</p>
                <p>
                  {formatearTelefono(persona.telefono)} · {persona.correo}
                </p>
                <p>
                  Correo {textoCanal(persona.notificacion.correo)} · WhatsApp {textoCanal(persona.notificacion.sms)}
                  {persona.llegadaEn ? ` · Ingreso ${formatoFechaHora(persona.llegadaEn)}` : ""}
                </p>
                <Acciones persona={persona} ocupado={ocupado} onCambiar={cambiar} onReenviar={reenviar} />
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function textoCanal(canal: CanalAviso) {
  if (canal === "enviado") return "enviado";
  if (canal === "error") return "con error";
  return "sin configurar";
}

function Acciones({
  persona,
  ocupado,
  onCambiar,
  onReenviar,
}: {
  persona: Invitado;
  ocupado: string;
  onCambiar: (slug: string, accion: "llegada" | "revertir") => Promise<void>;
  onReenviar: (slug: string) => Promise<void>;
}) {
  const bloqueado = ocupado.endsWith(persona.slug);
  return (
    <div className="acciones-fila">
      {persona.llego ? (
        <button className="boton-peligro boton-pequeno" type="button" disabled={bloqueado} onClick={() => void onCambiar(persona.slug, "revertir")}>
          Deshacer
        </button>
      ) : (
        <button className="boton boton-pequeno" type="button" disabled={bloqueado} onClick={() => void onCambiar(persona.slug, "llegada")}>
          Registrar llegada
        </button>
      )}
      <Link className="boton-secundario boton-pequeno" href={`/confirmacion/${persona.slug}`} target="_blank">
        Ver pase
      </Link>
      <button className="boton-secundario boton-pequeno" type="button" disabled={bloqueado} onClick={() => void onReenviar(persona.slug)}>
        Reenviar aviso
      </button>
    </div>
  );
}
