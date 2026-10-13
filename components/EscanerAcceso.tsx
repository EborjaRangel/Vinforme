"use client";

import { useEffect, useRef, useState } from "react";
import { resumir } from "@/lib/resumen";
import type { Invitado, ResumenAsistencia } from "@/lib/types";

type Resultado =
  | { tipo: "nuevo"; nombre: string; institucion: string; enEvento: number }
  | { tipo: "previo"; nombre: string; institucion: string; enEvento: number }
  | { tipo: "aviso"; titulo: string; detalle: string }
  | { tipo: "error"; detalle: string };

export function EscanerAcceso({ iniciales }: { iniciales: Invitado[] }) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [camara, setCamara] = useState("Preparando la cámara…");
  const [resumen, setResumen] = useState<ResumenAsistencia>(resumir(iniciales));
  const [folio, setFolio] = useState("");
  const ultimo = useRef<{ slug: string; en: number } | null>(null);
  const ocupado = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetch("/api/invitados", { cache: "no-store" })
        .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
        .then((datos: { resumen?: ResumenAsistencia } | null) => {
          if (datos?.resumen) setResumen(datos.resumen);
        });
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelado = false;
    let lector: { stop: () => Promise<void>; isScanning: boolean } | null = null;

    async function iniciar() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelado) return;
        const instancia = new Html5Qrcode("lector-qr");
        lector = instancia;
        await instancia.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (texto) => {
            void registrar(texto);
          },
          () => undefined,
        );
        if (cancelado) {
          await instancia.stop().catch(() => undefined);
          return;
        }
        setCamara("Apunta la cámara al QR personal.");
      } catch (error) {
        if (!cancelado) setCamara(mensajeCamara(error));
      }
    }

    void iniciar();
    return () => {
      cancelado = true;
      if (lector?.isScanning) void lector.stop().catch(() => undefined);
    };
  }, []);

  async function registrar(texto: string) {
    const slug = slugDesde(texto);
    if (!slug) {
      setResultado({ tipo: "error", detalle: "Ese código no corresponde a un pase de este informe." });
      return;
    }
    if (slug === "GENERAL") {
      setResultado({
        tipo: "aviso",
        titulo: "QR de invitación",
        detalle: "Este es el código general. Sirve para registrarse, no para marcar una llegada.",
      });
      return;
    }

    const ahora = Date.now();
    if (ocupado.current) return;
    if (ultimo.current && ultimo.current.slug === slug && ahora - ultimo.current.en < 5000) return;
    ocupado.current = true;
    ultimo.current = { slug, en: ahora };

    try {
      const respuesta = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, accion: "llegada" }),
      });
      const datos = (await respuesta.json()) as {
        mensaje?: string;
        yaEstaba?: boolean;
        invitado?: Invitado;
        resumen?: ResumenAsistencia;
      };
      if (!respuesta.ok || !datos.invitado || !datos.resumen) {
        setResultado({ tipo: "error", detalle: datos.mensaje ?? "No se reconoció el pase." });
        return;
      }
      setResumen(datos.resumen);
      setResultado({
        tipo: datos.yaEstaba ? "previo" : "nuevo",
        nombre: datos.invitado.nombreCompleto,
        institucion: datos.invitado.institucion,
        enEvento: datos.resumen.enEvento,
      });
      navigator.vibrate?.(80);
    } catch {
      setResultado({ tipo: "error", detalle: "No hubo conexión para registrar el ingreso." });
    } finally {
      ocupado.current = false;
    }
  }

  async function leerArchivo(archivo: File) {
    const { Html5Qrcode } = await import("html5-qrcode");
    const lector = new Html5Qrcode("lector-archivo");
    try {
      const texto = await lector.scanFile(archivo, true);
      await registrar(texto);
    } catch {
      setResultado({ tipo: "error", detalle: "No se encontró un QR en esa imagen." });
    } finally {
      await lector.clear();
    }
  }

  return (
    <section className="pagina contenedor">
      <p className="kicker">Puerta de acceso</p>
      <h1>Escanear pase</h1>
      <p className="lead">{camara}</p>
      <article className="contador-puerta" aria-live="polite">
        <strong>{resumen.enEvento}</strong>
        personas en el evento
      </article>

      <div id="lector-qr" className="lector" />
      <div id="lector-archivo" className="oculto" />

      {resultado ? (
        <article className={resultado.tipo === "error" ? "resultado-scan aviso-error" : "resultado-scan aviso-ok"}>
          {resultado.tipo === "nuevo" || resultado.tipo === "previo" ? (
            <>
              <p className="kicker">{resultado.tipo === "nuevo" ? "Ingreso registrado" : "Ya había ingresado"}</p>
              <h2>{resultado.nombre}</h2>
              <p>{resultado.institucion}</p>
              <p>Personas en el evento: {resultado.enEvento}</p>
            </>
          ) : resultado.tipo === "aviso" ? (
            <>
              <h2>{resultado.titulo}</h2>
              <p>{resultado.detalle}</p>
            </>
          ) : (
            <p>{resultado.detalle}</p>
          )}
        </article>
      ) : null}

      <form
        className="formulario folio-manual"
        onSubmit={(evento) => {
          evento.preventDefault();
          void registrar(folio);
        }}
      >
        <label className="campo">
          Folio o enlace del pase
          <input value={folio} onChange={(evento) => setFolio(evento.target.value)} placeholder="nombre-primer-segundo" />
        </label>
        <div className="acciones">
          <button className="boton" type="submit">
            Registrar con folio
          </button>
          <label className="boton-secundario">
            Leer una imagen
            <input
              className="oculto"
              type="file"
              accept="image/*"
              onChange={(evento) => {
                const archivo = evento.target.files?.[0];
                if (archivo) void leerArchivo(archivo);
                evento.target.value = "";
              }}
            />
          </label>
        </div>
      </form>
    </section>
  );
}

function slugDesde(texto: string) {
  const limpio = texto.trim();
  if (!limpio) return null;
  if (/\/registro(?:$|\?)/.test(limpio) && !limpio.includes("/llegada/")) return "GENERAL";

  try {
    const url = new URL(limpio);
    const partes = url.pathname.split("/").filter(Boolean);
    const indice = partes.indexOf("llegada");
    if (indice >= 0 && partes[indice + 1]) return decodeURIComponent(partes[indice + 1]).toLowerCase();
    if (partes.includes("registro")) return "GENERAL";
  } catch {
    const coincidencia = limpio.match(/llegada\/([a-z0-9-]+)/i);
    if (coincidencia?.[1]) return coincidencia[1].toLowerCase();
  }

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(limpio)) return limpio.toLowerCase();
  return null;
}

function mensajeCamara(error: unknown) {
  const texto = error instanceof Error ? error.message : "";
  if (/notallowed|permission/i.test(texto)) return "El navegador no tiene permiso para usar la cámara. Puedes capturar el folio a mano.";
  if (/notfound|notreadable/i.test(texto)) return "No hay una cámara disponible. Puedes capturar el folio o subir la imagen del QR.";
  if (/secure|https/i.test(texto)) return "La cámara del navegador pide un sitio con HTTPS. También puedes usar el folio.";
  return "No se pudo abrir la cámara. El folio escrito sigue funcionando.";
}
