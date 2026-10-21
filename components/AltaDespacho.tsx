"use client";

import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuTransporte } from "@/components/MenuTransporte";
import { esquemaAltaDespacho } from "@/lib/validacion";

type Usuario = { usuario: string; nombre: string; es_admin: boolean; activo: boolean };

export function AltaDespacho() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [listo, setListo] = useState(false);
  const formik = useFormik({
    initialValues: { nombre: "", usuario: "", clave: "" },
    validationSchema: esquemaAltaDespacho,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      const respuesta = await fetch("/api/transporte/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });
      const datos = (await respuesta.json()) as { mensaje?: string };
      if (!respuesta.ok) {
        helpers.setStatus(datos.mensaje ?? "No se pudo dar de alta.");
        return;
      }
      helpers.resetForm();
      helpers.setStatus("Persona dada de alta. Ya puede entrar a despachar.");
      const lista = await fetch("/api/transporte/usuarios").then((item) => item.json() as Promise<{ usuarios?: Usuario[] }>);
      setUsuarios(lista.usuarios ?? []);
    },
  });

  useEffect(() => {
    void fetch("/api/transporte/usuarios")
      .then(async (respuesta) => {
        if (respuesta.status === 401) {
          router.replace("/transporte");
          return null;
        }
        return respuesta.json() as Promise<{ usuarios?: Usuario[] }>;
      })
      .then((datos) => {
        if (!datos) return;
        setUsuarios(datos.usuarios ?? []);
        setListo(true);
      });
  }, [router]);

  if (!listo) return <section className="pagina contenedor"><p>Cargando…</p></section>;

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Alta de despacho</h1>
      <p className="lead">Da de alta a las personas que despachan los micros. Aquí se les asigna usuario y contraseña.</p>
      <MenuTransporte activo="usuarios" esAdmin />
      <ul className="mt-4 grid gap-2">
        {usuarios.map((persona) => (
          <li key={persona.usuario}>
            <strong>{persona.nombre}</strong> · {persona.usuario}
            {persona.es_admin ? " · administrador" : " · despacho"}
          </li>
        ))}
      </ul>
      <form className="formulario rejilla-form" onSubmit={formik.handleSubmit}>
        <label className="campo">
          Nombre
          <input name="nombre" value={formik.values.nombre} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          {formik.touched.nombre && formik.errors.nombre ? <small className="error">{formik.errors.nombre}</small> : null}
        </label>
        <label className="campo">
          Usuario
          <input name="usuario" autoCapitalize="none" value={formik.values.usuario} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          {formik.touched.usuario && formik.errors.usuario ? <small className="error">{formik.errors.usuario}</small> : null}
        </label>
        <label className="campo">
          Contraseña
          <input name="clave" type="password" value={formik.values.clave} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          {formik.touched.clave && formik.errors.clave ? <small className="error">{formik.errors.clave}</small> : null}
        </label>
        {formik.status ? <p className="campo-ancho">{formik.status}</p> : null}
        <button className="boton" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Guardando…" : "Dar de alta"}
        </button>
      </form>
    </section>
  );
}
