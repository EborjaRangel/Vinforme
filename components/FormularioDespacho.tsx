"use client";

import { useFormik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { esquemaDespacho } from "@/lib/validacion";

type Dirigente = {
  id: string;
  nombreCompleto: string;
  telefono: string;
  colonia: string;
  estatus: string;
};

async function fotoLigera(archivo: File) {
  if (archivo.size < 700_000 && archivo.type === "image/jpeg") return archivo;
  try {
    const imagen = await createImageBitmap(archivo);
    const limite = 1600;
    const escala = Math.min(1, limite / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.max(1, Math.round(imagen.width * escala));
    lienzo.height = Math.max(1, Math.round(imagen.height * escala));
    const contexto = lienzo.getContext("2d");
    if (!contexto) return archivo;
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/jpeg", 0.72));
    imagen.close();
    if (!blob) return archivo;
    return new File([blob], "unidad.jpg", { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

const TIPOS = [
  { id: "camion", etiqueta: "Camión" },
  { id: "microbus", etiqueta: "Microbús" },
  { id: "van", etiqueta: "Van" },
] as const;

const iniciales = {
  dirigenteId: "",
  tipo: "",
  placas: "",
  choferNombre: "",
  choferTelefono: "",
  idaVuelta: "",
  lat: "",
  lng: "",
  foto: null as File | null,
};

export function FormularioDespacho() {
  const [dirigentes, setDirigentes] = useState<Dirigente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [ubicacion, setUbicacion] = useState("Aún no se toma la ubicación.");
  const [avisoLista, setAvisoLista] = useState("");
  const [fotoKey, setFotoKey] = useState(0);
  const formik = useFormik({
    initialValues: iniciales,
    validationSchema: esquemaDespacho,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      if (!(valores.foto instanceof File)) {
        helpers.setStatus("Toma la foto del transporte.");
        return;
      }
      try {
        const fotoLista = await fotoLigera(valores.foto);
        if (fotoLista.size > 3 * 1024 * 1024) {
          helpers.setStatus("La foto es demasiado pesada. Acércala a la unidad y tómala de nuevo.");
          return;
        }
        const datos = new FormData();
        datos.set("dirigenteId", valores.dirigenteId);
        datos.set("tipo", valores.tipo);
        datos.set("placas", valores.placas);
        datos.set("choferNombre", valores.choferNombre);
        datos.set("choferTelefono", valores.choferTelefono);
        datos.set("idaVuelta", valores.idaVuelta);
        datos.set("lat", valores.lat);
        datos.set("lng", valores.lng);
        datos.set("foto", fotoLista);
        const respuesta = await fetch("/api/transporte/despacho", { method: "POST", body: datos });
        const texto = await respuesta.text();
        let cuerpo: { ok?: boolean; mensaje?: string } = {};
        try {
          cuerpo = JSON.parse(texto) as { ok?: boolean; mensaje?: string };
        } catch {
          cuerpo = { mensaje: "No se pudo guardar el despacho. Intenta de nuevo." };
        }
        if (!respuesta.ok || !cuerpo.ok) {
          helpers.setStatus(cuerpo.mensaje ?? "No se pudo guardar el despacho.");
          return;
        }
        helpers.resetForm();
        setBusqueda("");
        setUbicacion("Aún no se toma la ubicación.");
        setFotoKey((valor) => valor + 1);
        helpers.setStatus("Unidad registrada y asignada al dirigente.");
      } catch {
        helpers.setStatus("No hubo conexión para guardar el despacho.");
      }
    },
  });

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
    const base = dirigentes.filter((persona) => {
      const estatus = persona.estatus.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
      return estatus === "ACTIVO" || estatus === "ALTA";
    });
    if (texto.length < 2) return base.slice(0, 12);
    return base
      .filter((persona) => persona.nombreCompleto.toLocaleLowerCase("es-MX").includes(texto))
      .slice(0, 12);
  }, [busqueda, dirigentes]);

  const elegido = dirigentes.find((persona) => persona.id === formik.values.dirigenteId);

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
    formik.setStatus("");
    if (!navigator.geolocation) {
      setUbicacion("Este navegador no puede tomar la ubicación.");
      return;
    }
    setUbicacion("Buscando el punto de entrega…");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        void formik.setFieldValue("lat", String(posicion.coords.latitude));
        void formik.setFieldValue("lng", String(posicion.coords.longitude));
        setUbicacion(
          `Ubicación lista: ${posicion.coords.latitude.toFixed(5)}, ${posicion.coords.longitude.toFixed(5)}`,
        );
      },
      () => setUbicacion("No se autorizó la ubicación. Actívala para registrar la entrega."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <form className="formulario rejilla-form" onSubmit={formik.handleSubmit}>
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
            className={persona.id === formik.values.dirigenteId ? "boton" : "boton-secundario"}
            type="button"
            onClick={() => {
              void formik.setFieldValue("dirigenteId", persona.id);
              setBusqueda(persona.nombreCompleto);
            }}
          >
            {persona.nombreCompleto}
            {persona.colonia ? ` · ${persona.colonia}` : ""}
          </button>
        ))}
        {formik.touched.dirigenteId && formik.errors.dirigenteId ? <small className="error">{formik.errors.dirigenteId}</small> : null}
      </div>
      <fieldset className="campo campo-ancho">
        <legend>Tipo de transporte</legend>
        <div className="acciones">
          {TIPOS.map((item) => (
            <button
              key={item.id}
              className={formik.values.tipo === item.id ? "boton" : "boton-secundario"}
              type="button"
              onClick={() => void formik.setFieldValue("tipo", item.id)}
            >
              {item.etiqueta}
            </button>
          ))}
        </div>
        {formik.touched.tipo && formik.errors.tipo ? <small className="error">{formik.errors.tipo}</small> : null}
      </fieldset>
      <label className="campo">
        Placas
        <input name="placas" maxLength={12} autoCapitalize="characters" value={formik.values.placas} onChange={formik.handleChange} onBlur={formik.handleBlur} />
        {formik.touched.placas && formik.errors.placas ? <small className="error">{formik.errors.placas}</small> : null}
      </label>
      <label className="campo">
        Nombre del chofer
        <input name="choferNombre" value={formik.values.choferNombre} onChange={formik.handleChange} onBlur={formik.handleBlur} />
        {formik.touched.choferNombre && formik.errors.choferNombre ? <small className="error">{formik.errors.choferNombre}</small> : null}
      </label>
      <label className="campo">
        Teléfono del chofer
        <input name="choferTelefono" type="tel" inputMode="numeric" placeholder="10 dígitos" value={formik.values.choferTelefono} onChange={formik.handleChange} onBlur={formik.handleBlur} />
        {formik.touched.choferTelefono && formik.errors.choferTelefono ? <small className="error">{formik.errors.choferTelefono}</small> : null}
      </label>
      <fieldset className="campo campo-ancho">
        <legend>Recorrido</legend>
        <div className="acciones">
          <button className={formik.values.idaVuelta === "no" ? "boton" : "boton-secundario"} type="button" onClick={() => void formik.setFieldValue("idaVuelta", "no")}>
            Solo ida
          </button>
          <button className={formik.values.idaVuelta === "si" ? "boton" : "boton-secundario"} type="button" onClick={() => void formik.setFieldValue("idaVuelta", "si")}>
            Ida y vuelta
          </button>
        </div>
        {formik.touched.idaVuelta && formik.errors.idaVuelta ? <small className="error">{formik.errors.idaVuelta}</small> : null}
      </fieldset>
      <div className="campo campo-ancho">
        <span>Punto de entrega</span>
        <button className="boton-secundario" type="button" onClick={tomarUbicacion}>
          Tomar ubicación
        </button>
        <p>{ubicacion}</p>
        {formik.touched.lat && formik.errors.lat ? <small className="error">{formik.errors.lat}</small> : null}
      </div>
      <label className="campo campo-ancho">
        Foto de la unidad
        <input
          key={fotoKey}
          name="foto"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(evento) => void formik.setFieldValue("foto", evento.target.files?.[0] ?? null)}
        />
        {formik.touched.foto && formik.errors.foto ? <small className="error">{formik.errors.foto}</small> : null}
      </label>
      {formik.status && formik.status !== "Unidad registrada y asignada al dirigente." ? (
        <p className="aviso-error campo-ancho" role="alert">
          {formik.status}
        </p>
      ) : null}
      {formik.status === "Unidad registrada y asignada al dirigente." ? <p className="aviso-ok campo-ancho">{formik.status}</p> : null}
      <button className="boton" type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? "Guardando…" : "Registrar entrega"}
      </button>
    </form>
  );
}
