"use client";

import { useState, type FormEvent } from "react";
import { formatoFechaHora } from "@/lib/formato";
import type { ResumenAsistencia } from "@/lib/types";

export function EstadoLlegada({
  slug,
  llegadaInicial,
}: {
  slug: string;
  llegadaInicial: string | null;
}) {
  const [clave, setClave] = useState("");
  const [fase, setFase] = useState<"esperando" | "enviando" | "nuevo" | "previo" | "error">("esperando");
  const [hora, setHora] = useState(llegadaInicial);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const [mensaje, setMensaje] = useState("");

  async function registrar(evento: FormEvent) {
    evento.preventDefault();
    setFase("enviando");
    setMensaje("");
    try {
      const respuesta = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, accion: "llegada", clave }),
      });
      const datos = (await respuesta.json()) as {
        mensaje?: string;
        yaEstaba?: boolean;
        invitado?: { llegadaEn: string | null };
        resumen?: ResumenAsistencia;
      };
      if (!respuesta.ok || !datos.invitado) {
        setFase("error");
        setMensaje(datos.mensaje ?? "No se pudo registrar el ingreso.");
        return;
      }
      setHora(datos.invitado.llegadaEn);
      setResumen(datos.resumen ?? null);
      setFase(datos.yaEstaba ? "previo" : "nuevo");
    } catch {
      setFase("error");
      setMensaje("No hubo conexión para registrar el ingreso.");
    }
  }

  if (fase === "nuevo" || fase === "previo") {
    return (
      <div>
        <p className={fase === "nuevo" ? "aviso-ok" : "aviso-local"}>
          {fase === "nuevo" ? "Ingreso registrado." : "Esta persona ya había ingresado."}
        </p>
        <p>Hora de ingreso: {formatoFechaHora(hora)}</p>
        {resumen ? (
          <article className="contador-puerta" aria-live="polite">
            <strong>{resumen.enEvento}</strong>
            personas en el evento
          </article>
        ) : null}
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={registrar}>
      <p className="lead lead-centro">
        Solo el personal autorizado puede registrar esta llegada. Sin la clave, el ingreso no se cuenta.
      </p>
      <label className="campo">
        Clave de acceso
        <input
          type="password"
          name="clave"
          autoComplete="current-password"
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
          required
        />
      </label>
      {fase === "error" ? (
        <p className="aviso-error" role="alert">
          {mensaje}
        </p>
      ) : null}
      <button className="boton" type="submit" disabled={fase === "enviando" || clave.trim().length === 0}>
        {fase === "enviando" ? "Registrando…" : "Registrar ingreso"}
      </button>
    </form>
  );
}
