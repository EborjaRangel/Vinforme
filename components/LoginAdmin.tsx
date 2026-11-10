"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { esquemaLoginAdmin } from "@/lib/validacion";

export function LoginAdmin({ ayuda }: { ayuda: boolean }) {
  const router = useRouter();
  const formik = useFormik({
    initialValues: { usuario: "", clave: "" },
    validationSchema: esquemaLoginAdmin,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      try {
        const respuesta = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valores),
        });
        const datos = (await respuesta.json()) as { mensaje?: string };
        if (!respuesta.ok) {
          helpers.setStatus(datos.mensaje ?? "El usuario o la contraseña no son correctos.");
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
      <p className="kicker">Control de acceso</p>
      <h1>Entrada del personal</h1>
      <p className="lead">Entra con tu usuario y contraseña para consultar quién ya llegó y cuántas personas hay en el evento.</p>
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
        {ayuda ? (
          <p className="nota">
            En esta copia local el usuario inicial es <strong>alcaldia</strong> y la clave es <strong>coyoacan-informe</strong>,
            salvo que ya las hayas cambiado en el archivo .env.local.
          </p>
        ) : null}
        <button className="boton" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
