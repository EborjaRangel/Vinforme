"use client";

import cargar from "next/dynamic";

const Mapa = cargar(() => import("@/components/MapaTransporte").then((modulo) => modulo.MapaTransporte), {
  ssr: false,
});

export function MapaTransporteCarga() {
  return <Mapa />;
}
