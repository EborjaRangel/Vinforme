"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { formatoFechaHora } from "@/lib/formato";

type Despacho = {
  id: string;
  dirigenteId: string;
  dirigente: string;
  tipo: "camion" | "microbus" | "van";
  placas: string;
  choferNombre: string;
  choferTelefono: string;
  idaVuelta: boolean;
  lat: number;
  lng: number;
  lugarTexto: string;
  entregadoEn: string;
};

const COLORES = { camion: "#704D9F", microbus: "#1E8E3E", van: "#F26B1D" };
const NOMBRES = { camion: "Camión", microbus: "Microbús", van: "Van" };

function textoPlano(valor: string) {
  return valor.replace(/[&<>"']/g, (caracter) => {
    const mapa: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return mapa[caracter];
  });
}

function iconoUnidad(L: typeof import("leaflet"), color: string) {
  return L.divIcon({
    className: "icono-unidad",
    iconSize: [36, 24],
    iconAnchor: [18, 22],
    popupAnchor: [0, -18],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24" aria-hidden="true">
      <rect x="1" y="4" width="19" height="12" rx="1.6" fill="${color}"/>
      <path d="M20 8.2h6.4c.5 0 .9.2 1.2.6l4.2 5.1c.3.4.4.9.4 1.4V16H20V8.2z" fill="${color}"/>
      <rect x="23.2" y="9.2" width="4.4" height="3.1" rx="0.4" fill="#ffffff" opacity="0.9"/>
      <circle cx="9" cy="18.2" r="2.7" fill="#241c33"/>
      <circle cx="9" cy="18.2" r="1.1" fill="#f7f7f7"/>
      <circle cx="27" cy="18.2" r="2.7" fill="#241c33"/>
      <circle cx="27" cy="18.2" r="1.1" fill="#f7f7f7"/>
    </svg>`,
  });
}

export function MapaTransporte() {
  const caja = useRef<HTMLDivElement>(null);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [aviso, setAviso] = useState("Cargando unidades…");

  useEffect(() => {
    void fetch("/api/transporte/despachos")
      .then((respuesta) => respuesta.json())
      .then((datos: { despachos?: Despacho[] }) => {
        setDespachos(datos.despachos ?? []);
        setAviso((datos.despachos ?? []).length ? "" : "Todavía no hay unidades entregadas.");
      })
      .catch(() => setAviso("No se pudo cargar el mapa."));
  }, []);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    let mapa: { remove: () => void } | null = null;
    let cancelado = false;

    void import("leaflet").then(async (modulo) => {
      if (cancelado || !caja.current) return;
      const L = modulo.default;
      const instancia = L.map(caja.current).setView([19.33, -99.15], 12);
      mapa = instancia;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(instancia);

      const conjunto = L.featureGroup();
      try {
        const respuesta = await fetch("/coyoacan.geojson");
        const limite = (await respuesta.json()) as GeoJSON.GeoJSON;
        if (cancelado) return;
        const capa = L.geoJSON(limite, {
          style: { color: "#36246B", weight: 3, fillColor: "#704D9F", fillOpacity: 0.12 },
        });
        capa.addTo(instancia);
        conjunto.addLayer(capa);
      } catch {
        setAviso((actual) => actual || "No se pudo dibujar el límite de Coyoacán.");
      }

      const unidades = L.featureGroup();
      for (const unidad of despachos) {
        const marca = L.marker([unidad.lat, unidad.lng], { icon: iconoUnidad(L, COLORES[unidad.tipo]) });
        const lugar = unidad.lugarTexto || "Punto de entrega";
        marca.bindPopup(
          `<strong>${textoPlano(NOMBRES[unidad.tipo])} ${textoPlano(unidad.placas)}</strong><br>${textoPlano(unidad.dirigente)}<br>${textoPlano(lugar)}<br>Teléfono del chofer: ${textoPlano(unidad.choferTelefono)}<br>${textoPlano(formatoFechaHora(unidad.entregadoEn))}`,
        );
        unidades.addLayer(marca);
      }
      if (despachos.length) {
        unidades.addTo(instancia);
        conjunto.addLayer(unidades);
      }
      const ajustar = () => {
        if (cancelado) return;
        instancia.invalidateSize();
        if (conjunto.getLayers().length) instancia.fitBounds(conjunto.getBounds(), { padding: [18, 18] });
      };
      ajustar();
      window.setTimeout(ajustar, 150);
    });

    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [despachos]);

  const porDirigente = useMemo(() => {
    const mapa = new Map<string, { nombre: string; camion: number; microbus: number; van: number }>();
    for (const unidad of despachos) {
      const actual = mapa.get(unidad.dirigenteId) ?? { nombre: unidad.dirigente, camion: 0, microbus: 0, van: 0 };
      actual[unidad.tipo] += 1;
      mapa.set(unidad.dirigenteId, actual);
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [despachos]);

  return (
    <div className="grid gap-6">
      {aviso ? <p className="aviso-local">{aviso}</p> : null}
      <div className="h-[28rem] w-full overflow-hidden rounded-lg border border-linea">
        <div ref={caja} className="h-full w-full" />
      </div>
      <div className="acciones">
        <span className="font-bold" style={{ color: COLORES.camion }}>Camión</span>
        <span className="font-bold" style={{ color: COLORES.microbus }}>Microbús</span>
        <span className="font-bold" style={{ color: COLORES.van }}>Van</span>
      </div>
      <section>
        <h2>Unidades por dirigente</h2>
        <div className="tarjetas-persona">
          {porDirigente.map((fila) => (
            <article className="persona" key={fila.nombre}>
              <h3>{fila.nombre}</h3>
              <p>
                Camiones {fila.camion} · Microbuses {fila.microbus} · Vans {fila.van}
              </p>
            </article>
          ))}
        </div>
      </section>
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Hora de entrega</th>
              <th>Dirigente</th>
              <th>Tipo</th>
              <th>Placas</th>
              <th>Chofer</th>
              <th>Teléfono del chofer</th>
              <th>Recorrido</th>
              <th>Lugar</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {despachos.map((unidad) => (
              <tr key={unidad.id}>
                <td>{formatoFechaHora(unidad.entregadoEn)}</td>
                <td>{unidad.dirigente}</td>
                <td>{NOMBRES[unidad.tipo]}</td>
                <td>{unidad.placas}</td>
                <td>{unidad.choferNombre}</td>
                <td>{unidad.choferTelefono}</td>
                <td>{unidad.idaVuelta ? "Ida y vuelta" : "Solo ida"}</td>
                <td>{unidad.lugarTexto || `${unidad.lat.toFixed(5)}, ${unidad.lng.toFixed(5)}`}</td>
                <td>
                  <a href={`/api/transporte/foto/${unidad.id}`} target="_blank" rel="noreferrer">
                    Ver
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="detalle-entregas">
        {despachos.map((unidad) => (
          <article className="persona" key={unidad.id}>
            <h3>{unidad.dirigente}</h3>
            <p>
              {formatoFechaHora(unidad.entregadoEn)} · {NOMBRES[unidad.tipo]} {unidad.placas}
            </p>
            <p>
              {unidad.choferNombre} · {unidad.choferTelefono}
            </p>
            <p>{unidad.lugarTexto || "Punto de entrega"}</p>
            <p>{unidad.idaVuelta ? "Ida y vuelta" : "Solo ida"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
