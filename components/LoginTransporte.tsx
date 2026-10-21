"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { esquemaLoginTransporte } from "@/lib/validacion";

export function LoginTransporte() {
  const router = useRouter();
  const formik = useFormik({
    initialValues: { usuario: "", clave: "" },
    validationSchema: esquemaLoginTransporte,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      try {
        const respuesta = await fetch("/api/transporte/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valores),
        });
        const datos = (await respuesta.json()) as { mensaje?: string };
        if (!respuesta.ok) {
          helpers.setStatus(datos.mensaje ?? "No fue posible entrar.");
          return;
        }
        router.refresh();
      } catch {
        helpers.setStatus("No fue posible entrar. Intenta de nuevo.");
      }
    },
  });

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Despacho de unidades</h1>
      <p className="lead">Entra con tu usuario y contraseña para registrar la entrega de un camión, microbús o van.</p>
      <form className="formulario login" onSubmit={formik.handleSubmit}>
        <label className="campo">
          Usuario
          <input
            name="usuario"
            value={formik.values.usuario}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            autoComplete="username"
          />
          {formik.touched.usuario && formik.errors.usuario ? <small className="error">{formik.errors.usuario}</small> : null}
        </label>
        <label className="campo">
          Contraseña
          <input
            name="clave"
            type="password"
            value={formik.values.clave}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            autoComplete="current-password"
          />
          {formik.touched.clave && formik.errors.clave ? <small className="error">{formik.errors.clave}</small> : null}
        </label>
        {formik.status ? (
          <p className="aviso-error" role="alert">
            {formik.status}
          </p>
        ) : null}
        <button className="boton" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
