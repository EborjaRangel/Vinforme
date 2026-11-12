"use client";

import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuTransporte } from "@/components/MenuTransporte";
import { TablaCuentas } from "@/components/TablaCuentas";
import { esquemaAltaDespacho } from "@/lib/validacion";

type Usuario = { usuario: string; nombre: string; es_admin: boolean; activo: boolean; clave_visible?: string };

export function AltaDespacho() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [listo, setListo] = useState(false);
  const [ocupado, setOcupado] = useState("");
  const [aviso, setAviso] = useState("");
  const formik = useFormik({
    initialValues: { nombre: "", usuario: "", clave: "" },
    validationSchema: esquemaAltaDespacho,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      setAviso("");
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
      helpers.setStatus("Persona dada de alta. Ya puede entrar solo a Transporte.");
      await recargar();
    },
  });

  async function recargar() {
    const respuesta = await fetch("/api/transporte/usuarios");
    if (respuesta.status === 401) {
      router.replace("/transporte");
      return;
    }
    const datos = (await respuesta.json()) as { usuarios?: Usuario[] };
    setUsuarios(datos.usuarios ?? []);
    setListo(true);
  }

  async function cambiarEstado(usuario: string, activo: boolean) {
    setOcupado(usuario);
    setAviso("");
    try {
      const respuesta = await fetch("/api/transporte/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, activo }),
      });
      const datos = (await respuesta.json()) as { mensaje?: string };
      if (!respuesta.ok) {
        setAviso(datos.mensaje ?? "No se pudo actualizar el usuario.");
        return;
      }
      await recargar();
    } finally {
      setOcupado("");
    }
  }

  useEffect(() => {
    void recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial al abrir Usuarios
  }, []);

  if (!listo) return <section className="pagina contenedor"><p>Cargando…</p></section>;

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Usuarios</h1>
      <p className="lead">
        Da de alta o de baja a las personas que despachan. Cada usuario entra solo a Transporte y en el mapa ve únicamente
        las unidades que él despachó.
      </p>
      <MenuTransporte activo="usuarios" esAdmin />
      {aviso ? <p className="aviso-error">{aviso}</p> : null}
      <TablaCuentas cuentas={usuarios} ocupado={ocupado} onEstado={(usuario, activo) => void cambiarEstado(usuario, activo)} />
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
