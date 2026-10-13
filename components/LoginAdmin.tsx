"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginAdmin({ ayuda }: { ayuda: boolean }) {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const respuesta = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      const datos = (await respuesta.json()) as { mensaje?: string };
      if (!respuesta.ok) {
        setError(datos.mensaje ?? "La clave de acceso no es correcta.");
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
      <p className="kicker">Control de acceso</p>
      <h1>Entrada del personal</h1>
      <p className="lead">Aquí se consulta quién ya llegó y cuántas personas hay en el evento.</p>
      <form className="formulario login" onSubmit={enviar}>
        <label className="campo">
          Clave de acceso
          <input type="password" value={clave} onChange={(evento) => setClave(evento.target.value)} autoComplete="current-password" required />
        </label>
        {error ? (
          <p className="aviso-error" role="alert">
            {error}
          </p>
        ) : null}
        {ayuda ? (
          <p className="nota">
            En esta copia local la clave inicial es <strong>coyoacan-informe</strong>, salvo que ya la hayas cambiado en el
            archivo .env.local.
          </p>
        ) : null}
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
