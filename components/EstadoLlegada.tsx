"use client";

import { useEffect, useState } from "react";
import { formatoFechaHora } from "@/lib/formato";
import type { ResumenAsistencia } from "@/lib/types";

export function EstadoLlegada({
  slug,
  llegadaInicial,
}: {
  slug: string;
  llegadaInicial: string | null;
}) {
  const [fase, setFase] = useState<"cargando" | "nuevo" | "previo" | "error">("cargando");
  const [hora, setHora] = useState(llegadaInicial);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    async function marcar() {
      try {
        const respuesta = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, accion: "llegada" }),
        });
        const datos = (await respuesta.json()) as {
          mensaje?: string;
          yaEstaba?: boolean;
          invitado?: { llegadaEn: string | null };
          resumen?: ResumenAsistencia;
        };
        if (!activo) return;
        if (!respuesta.ok || !datos.invitado) {
          setFase("error");
          setMensaje(datos.mensaje ?? "No se pudo registrar el ingreso.");
          return;
        }
        setHora(datos.invitado.llegadaEn);
        setResumen(datos.resumen ?? null);
        setFase(datos.yaEstaba ? "previo" : "nuevo");
      } catch {
        if (!activo) return;
        setFase("error");
        setMensaje("No hubo conexión para registrar el ingreso.");
      }
    }

    void marcar();
    return () => {
      activo = false;
    };
  }, [slug]);

  if (fase === "cargando") return <p className="aviso-ok">Registrando el ingreso…</p>;
  if (fase === "error") {
    return (
      <div>
        <p className="aviso-error" role="alert">
          {mensaje}
        </p>
        <button className="boton" type="button" onClick={() => window.location.reload()}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

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
