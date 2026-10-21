"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuTransporte } from "@/components/MenuTransporte";

type Usuario = { usuario: string; nombre: string; es_admin: boolean; activo: boolean };

export default function PaginaUsuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [listo, setListo] = useState(false);

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

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje("");
    const formulario = new FormData(evento.currentTarget);
    const respuesta = await fetch("/api/transporte/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: formulario.get("usuario"),
        nombre: formulario.get("nombre"),
        clave: formulario.get("clave"),
      }),
    });
    const datos = (await respuesta.json()) as { mensaje?: string };
    if (!respuesta.ok) {
      setMensaje(datos.mensaje ?? "No se pudo crear el usuario.");
      return;
    }
    evento.currentTarget.reset();
    setMensaje("Usuario creado.");
    const lista = await fetch("/api/transporte/usuarios").then((item) => item.json() as Promise<{ usuarios?: Usuario[] }>);
    setUsuarios(lista.usuarios ?? []);
  }

  if (!listo) return <section className="pagina contenedor"><p>Cargando usuarios…</p></section>;

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Usuarios de despacho</h1>
      <p className="lead">Estas personas pueden registrar la entrega de unidades.</p>
      <MenuTransporte activo="usuarios" esAdmin />
      <ul className="mt-4 grid gap-2">
        {usuarios.map((persona) => (
          <li key={persona.usuario}>
            <strong>{persona.nombre}</strong> · {persona.usuario}
            {persona.es_admin ? " · administrador" : ""}
          </li>
        ))}
      </ul>
      <form className="formulario rejilla-form" onSubmit={crear}>
        <label className="campo">
          Nombre
          <input name="nombre" required />
        </label>
        <label className="campo">
          Usuario
          <input name="usuario" required autoCapitalize="none" />
        </label>
        <label className="campo">
          Contraseña
          <input name="clave" type="password" required minLength={8} />
        </label>
        {mensaje ? <p className="campo-ancho">{mensaje}</p> : null}
        <button className="boton" type="submit">
          Crear usuario
        </button>
      </form>
    </section>
  );
}
