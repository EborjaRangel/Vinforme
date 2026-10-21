"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginTransporte() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const respuesta = await fetch("/api/transporte/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave }),
      });
      const datos = (await respuesta.json()) as { mensaje?: string };
      if (!respuesta.ok) {
        setError(datos.mensaje ?? "No fue posible entrar.");
        return;
      }
      router.refresh();
    } catch {
      setError("No fue posible entrar. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Despacho de unidades</h1>
      <p className="lead">Entra con tu usuario y contraseña para registrar la entrega de un camión, microbús o van.</p>
      <form className="formulario login" onSubmit={enviar}>
        <label className="campo">
          Usuario
          <input value={usuario} onChange={(evento) => setUsuario(evento.target.value)} autoComplete="username" required />
        </label>
        <label className="campo">
          Contraseña
          <input
            type="password"
            value={clave}
            onChange={(evento) => setClave(evento.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? (
          <p className="aviso-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
