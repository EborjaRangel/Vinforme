"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";

import { esquemaRecuperacion } from "@/lib/validacion";

const iniciales = {
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  correo: "",
};

export function RecuperarPase() {
  const router = useRouter();
  const formik = useFormik({
    initialValues: iniciales,
    validationSchema: esquemaRecuperacion,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      try {
        const respuesta = await fetch("/api/recuperar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valores),
        });
        const datos = (await respuesta.json()) as { ok: boolean; mensaje?: string; slug?: string };
        if (!respuesta.ok || !datos.slug) {
          helpers.setStatus(datos.mensaje ?? "No fue posible recuperar el pase.");
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
      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="rejilla-form">
          <label className="campo">
            Nombre
            <input name="nombre" value={formik.values.nombre} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            {formik.touched.nombre && formik.errors.nombre ? <small className="error">{formik.errors.nombre}</small> : null}
          </label>
          <label className="campo">
            Primer apellido
            <input
              name="primerApellido"
              value={formik.values.primerApellido}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.primerApellido && formik.errors.primerApellido ? (
              <small className="error">{formik.errors.primerApellido}</small>
            ) : null}
          </label>
          <label className="campo">
            Segundo apellido
            <input
              name="segundoApellido"
              value={formik.values.segundoApellido}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.segundoApellido && formik.errors.segundoApellido ? (
              <small className="error">{formik.errors.segundoApellido}</small>
            ) : null}
          </label>
          <label className="campo">
            Correo electrónico
            <input
              type="email"
              name="correo"
              value={formik.values.correo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.correo && formik.errors.correo ? <small className="error">{formik.errors.correo}</small> : null}
          </label>
        </div>
        {formik.status ? (
          <p className="aviso-error" role="alert">
            {formik.status}
          </p>
        ) : null}
        <button className="boton-secundario" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Buscando…" : "Ver mi pase"}
        </button>
      </form>
    </details>
  );
}
