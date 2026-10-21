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
  idaVuelta: boolean;
  lat: number;
  lng: number;
  lugarTexto: string;
  entregadoEn: string;
};

const COLORES = { camion: "#00A0DF", microbus: "#E91D2C", van: "#FDB614" };
const NOMBRES = { camion: "Camión", microbus: "Microbús", van: "Van" };

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
    if (!nodo || despachos.length === 0) return;
    let mapa: { remove: () => void } | null = null;
    let cancelado = false;

    void import("leaflet").then((modulo) => {
      if (cancelado || !caja.current) return;
      const L = modulo.default;
      const centro = despachos[0];
      const instancia = L.map(caja.current).setView([centro.lat, centro.lng], 12);
      mapa = instancia;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(instancia);
      const grupo = L.featureGroup();
      for (const unidad of despachos) {
        const marca = L.circleMarker([unidad.lat, unidad.lng], {
          radius: 9,
          color: COLORES[unidad.tipo],
          fillColor: COLORES[unidad.tipo],
          fillOpacity: 0.9,
        });
        marca.bindPopup(
          `<strong>${NOMBRES[unidad.tipo]} ${unidad.placas}</strong><br>${unidad.dirigente}<br>${unidad.lugarTexto || "Punto de entrega"}<br>${formatoFechaHora(unidad.entregadoEn)}`,
        );
        grupo.addLayer(marca);
      }
      grupo.addTo(instancia);
      instancia.fitBounds(grupo.getBounds().pad(0.2));
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
      <div ref={caja} className="h-[28rem] w-full overflow-hidden rounded-lg border border-linea" />
      <div className="acciones">
        <span className="font-bold text-azul">Camión</span>
        <span className="font-bold text-rojo">Microbús</span>
        <span className="font-bold text-oro">Van</span>
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
    </div>
  );
}
