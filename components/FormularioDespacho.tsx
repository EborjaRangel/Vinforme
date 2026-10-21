"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Dirigente = {
  id: string;
  nombreCompleto: string;
  telefono: string;
  colonia: string;
  activo: boolean;
};

const TIPOS = [
  { id: "camion", etiqueta: "Camión" },
  { id: "microbus", etiqueta: "Microbús" },
  { id: "van", etiqueta: "Van" },
] as const;

export function FormularioDespacho() {
  const [dirigentes, setDirigentes] = useState<Dirigente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [dirigenteId, setDirigenteId] = useState("");
  const [tipo, setTipo] = useState("");
  const [idaVuelta, setIdaVuelta] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [ubicacion, setUbicacion] = useState("Aún no se toma la ubicación.");
  const [avisoLista, setAvisoLista] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void fetch("/api/transporte/dirigentes")
      .then((respuesta) => respuesta.json())
      .then((datos: { dirigentes?: Dirigente[]; aviso?: string }) => {
        setDirigentes(datos.dirigentes ?? []);
        setAvisoLista(datos.aviso || "");
      });
  }, []);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-MX");
    const base = dirigentes.filter((persona) => persona.activo);
    if (texto.length < 2) return base.slice(0, 12);
    return base
      .filter((persona) => persona.nombreCompleto.toLocaleLowerCase("es-MX").includes(texto))
      .slice(0, 12);
  }, [busqueda, dirigentes]);

  const elegido = dirigentes.find((persona) => persona.id === dirigenteId);

  async function actualizarLista() {
    setAvisoLista("Actualizando la lista de dirigentes…");
    try {
      const respuesta = await fetch("/api/transporte/dirigentes", { method: "POST" });
      const datos = (await respuesta.json()) as { ok?: boolean; mensaje?: string; total?: number; dirigentes?: Dirigente[] };
      setDirigentes(datos.dirigentes ?? []);
      setAvisoLista(datos.ok ? "" : datos.mensaje || "No se pudo actualizar la lista.");
    } catch {
      setAvisoLista("No hubo conexión para actualizar la lista.");
    }
  }

  function tomarUbicacion() {
    setMensaje("");
    if (!navigator.geolocation) {
      setUbicacion("Este navegador no puede tomar la ubicación.");
      return;
    }
    setUbicacion("Buscando el punto de entrega…");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setLat(posicion.coords.latitude);
        setLng(posicion.coords.longitude);
        setUbicacion(
          `Ubicación lista: ${posicion.coords.latitude.toFixed(5)}, ${posicion.coords.longitude.toFixed(5)}`,
        );
      },
      () => setUbicacion("No se autorizó la ubicación. Actívala para registrar la entrega."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensaje("");
    setExito("");
    if (!dirigenteId || !tipo || !idaVuelta) {
      setMensaje("Elige el dirigente, el tipo de transporte y si es ida y vuelta.");
      return;
    }
    if (lat === null || lng === null) {
      setMensaje("Toma la ubicación en el punto donde entregas la unidad.");
      return;
    }
    const datos = new FormData(evento.currentTarget);
    datos.set("dirigenteId", dirigenteId);
    datos.set("tipo", tipo);
    datos.set("idaVuelta", idaVuelta);
    datos.set("lat", String(lat));
    datos.set("lng", String(lng));
    setEnviando(true);
    try {
      const respuesta = await fetch("/api/transporte/despacho", { method: "POST", body: datos });
      const cuerpo = (await respuesta.json()) as { ok?: boolean; mensaje?: string };
      if (!respuesta.ok || !cuerpo.ok) {
        setMensaje(cuerpo.mensaje ?? "No se pudo guardar el despacho.");
        return;
      }
      setExito("Unidad registrada y asignada al dirigente.");
      evento.currentTarget.reset();
      setTipo("");
      setIdaVuelta("");
      setDirigenteId("");
      setBusqueda("");
      setLat(null);
      setLng(null);
      setUbicacion("Aún no se toma la ubicación.");
    } catch {
      setMensaje("No hubo conexión para guardar el despacho.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario rejilla-form" onSubmit={enviar}>
      <label className="campo campo-ancho">
        Dirigente
        <input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Escribe el nombre para buscar"
        />
      </label>
      <button className="boton-secundario" type="button" onClick={() => void actualizarLista()}>
        Actualizar dirigentes
      </button>
      <div className="campo-ancho grid gap-2">
        {avisoLista ? <p className="aviso-error">{avisoLista}</p> : null}
        {elegido ? <p className="aviso-ok">Asignado a {elegido.nombreCompleto}</p> : null}
        {visibles.map((persona) => (
          <button
            key={persona.id}
            className={persona.id === dirigenteId ? "boton" : "boton-secundario"}
            type="button"
            onClick={() => {
              setDirigenteId(persona.id);
              setBusqueda(persona.nombreCompleto);
            }}
          >
            {persona.nombreCompleto}
            {persona.colonia ? ` · ${persona.colonia}` : ""}
          </button>
        ))}
      </div>
      <fieldset className="campo campo-ancho">
        <legend>Tipo de transporte</legend>
        <div className="acciones">
          {TIPOS.map((item) => (
            <button
              key={item.id}
              className={tipo === item.id ? "boton" : "boton-secundario"}
              type="button"
              onClick={() => setTipo(item.id)}
            >
              {item.etiqueta}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="campo">
        Placas
        <input name="placas" required maxLength={12} autoCapitalize="characters" />
      </label>
      <label className="campo">
        Nombre del chofer
        <input name="choferNombre" required />
      </label>
      <label className="campo">
        Teléfono del chofer
        <input name="choferTelefono" type="tel" inputMode="numeric" required placeholder="10 dígitos" />
      </label>
      <label className="campo">
        Contacto del transporte
        <input name="contactoNombre" required />
      </label>
      <label className="campo">
        Teléfono del contacto
        <input name="contactoTelefono" type="tel" inputMode="numeric" required placeholder="10 dígitos" />
      </label>
      <fieldset className="campo campo-ancho">
        <legend>Recorrido</legend>
        <div className="acciones">
          <button className={idaVuelta === "no" ? "boton" : "boton-secundario"} type="button" onClick={() => setIdaVuelta("no")}>
            Solo ida
          </button>
          <button className={idaVuelta === "si" ? "boton" : "boton-secundario"} type="button" onClick={() => setIdaVuelta("si")}>
            Ida y vuelta
          </button>
        </div>
      </fieldset>
      <div className="campo campo-ancho">
        <span>Punto de entrega</span>
        <button className="boton-secundario" type="button" onClick={tomarUbicacion}>
          Tomar ubicación
        </button>
        <p>{ubicacion}</p>
      </div>
      <label className="campo campo-ancho">
        Foto de la unidad
        <input name="foto" type="file" accept="image/*" capture="environment" required />
      </label>
      {mensaje ? (
        <p className="aviso-error campo-ancho" role="alert">
          {mensaje}
        </p>
      ) : null}
      {exito ? <p className="aviso-ok campo-ancho">{exito}</p> : null}
      <button className="boton" type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Registrar entrega"}
      </button>
    </form>
  );
}
