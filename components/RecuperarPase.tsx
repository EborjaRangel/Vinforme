"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { esquemaRecuperacion } from "@/lib/validacion";

type Coincidencia = { slug: string; nombreCompleto: string };

export function RecuperarPase() {
  const router = useRouter();
  const [coincidencias, setCoincidencias] = useState<Coincidencia[]>([]);
  const formik = useFormik({
    initialValues: { telefono: "" },
    validationSchema: esquemaRecuperacion,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      setCoincidencias([]);
      try {
        const respuesta = await fetch("/api/recuperar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valores),
        });
        const datos = (await respuesta.json()) as {
          ok: boolean;
          mensaje?: string;
          slug?: string;
          varios?: Coincidencia[];
        };
        if (!respuesta.ok || (!datos.slug && !datos.varios?.length)) {
          helpers.setStatus(datos.mensaje ?? "No fue posible recuperar el pase.");
          return;
        }
        if (datos.varios && datos.varios.length > 1) {
          setCoincidencias(datos.varios);
          return;
        }
        router.push(`/confirmacion/${datos.slug}`);
      } catch {
        helpers.setStatus("No fue posible recuperar el pase. Intenta de nuevo.");
      }
    },
  });

  return (
    <details className="recuperar">
      <summary>¿Ya confirmaste tu asistencia? Recupera tu pase</summary>
      <form className="mt-4 grid gap-4" onSubmit={formik.handleSubmit} noValidate>
        <label className="campo">
          Número celular
          <input
            name="telefono"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="10 dígitos"
            value={formik.values.telefono}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.telefono && formik.errors.telefono ? <small className="error">{formik.errors.telefono}</small> : null}
        </label>
        {formik.status ? (
          <p className="aviso-error" role="alert">
            {formik.status}
          </p>
        ) : null}
        {coincidencias.length > 0 ? (
          <div className="mt-3 grid gap-2">
            <p>Hay más de un registro con ese celular. Elige el pase:</p>
            <ul className="grid gap-2">
              {coincidencias.map((persona) => (
                <li key={persona.slug}>
                  <Link className="font-semibold text-azul" href={`/confirmacion/${persona.slug}`}>
                    {persona.nombreCompleto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <button className="boton-secundario" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Buscando…" : "Ver mi pase"}
        </button>
      </form>
    </details>
  );
}
