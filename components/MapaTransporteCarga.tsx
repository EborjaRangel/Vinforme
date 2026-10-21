"use client";

import "leaflet/dist/leaflet.css";
import cargar from "next/dynamic";

const Mapa = cargar(() => import("@/components/MapaTransporte").then((modulo) => modulo.MapaTransporte), {
  ssr: false,
});

export function MapaTransporteCarga() {
  return <Mapa />;
}
