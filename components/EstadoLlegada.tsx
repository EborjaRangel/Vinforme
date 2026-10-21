"use client";

import { useFormik } from "formik";
import { useState } from "react";
import { formatoFechaHora } from "@/lib/formato";
import type { ResumenAsistencia } from "@/lib/types";
import { esquemaClave } from "@/lib/validacion";

export function EstadoLlegada({
  slug,
  llegadaInicial,
}: {
  slug: string;
  llegadaInicial: string | null;
}) {
  const [fase, setFase] = useState<"esperando" | "nuevo" | "previo">("esperando");
  const [hora, setHora] = useState(llegadaInicial);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const formik = useFormik({
    initialValues: { clave: "" },
    validationSchema: esquemaClave,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      try {
      const respuesta = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, accion: "llegada", clave: valores.clave }),
      });
      const datos = (await respuesta.json()) as {
        mensaje?: string;
        yaEstaba?: boolean;
        invitado?: { llegadaEn: string | null };
        resumen?: ResumenAsistencia;
      };
      if (!respuesta.ok || !datos.invitado) {
        helpers.setStatus(datos.mensaje ?? "No se pudo registrar el ingreso.");
        return;
      }
      setHora(datos.invitado.llegadaEn);
      setResumen(datos.resumen ?? null);
      setFase(datos.yaEstaba ? "previo" : "nuevo");
      } catch {
        helpers.setStatus("No hubo conexión para registrar el ingreso.");
      }
    },
  });

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
    <form className="formulario" onSubmit={formik.handleSubmit}>
      <p className="lead lead-centro">
        Solo el personal autorizado puede registrar esta llegada. Sin la clave, el ingreso no se cuenta.
      </p>
      <label className="campo">
        Clave de acceso
        <input
          type="password"
          name="clave"
          autoComplete="current-password"
          value={formik.values.clave}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        {formik.touched.clave && formik.errors.clave ? <small className="error">{formik.errors.clave}</small> : null}
      </label>
      {formik.status ? (
        <p className="aviso-error" role="alert">
          {formik.status}
        </p>
      ) : null}
      <button className="boton" type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? "Registrando…" : "Registrar ingreso"}
      </button>
    </form>
  );
}
