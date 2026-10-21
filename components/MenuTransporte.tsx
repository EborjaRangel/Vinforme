"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function MenuTransporte({ activo, esAdmin }: { activo: string; esAdmin: boolean }) {
  const router = useRouter();
  const enlaces = [
    { href: "/transporte", id: "inicio", etiqueta: "Inicio" },
    { href: "/transporte/despacho", id: "despacho", etiqueta: "Despachar" },
    { href: "/transporte/mapa", id: "mapa", etiqueta: "Mapa" },
    ...(esAdmin ? [{ href: "/transporte/usuarios", id: "usuarios", etiqueta: "Usuarios" }] : []),
  ];

  return (
    <div className="acciones">
      {enlaces.map((item) => (
        <Link key={item.id} className={item.id === activo ? "boton" : "boton-secundario"} href={item.href}>
          {item.etiqueta}
        </Link>
      ))}
      <button
        className="boton-secundario"
        type="button"
        onClick={async () => {
          await fetch("/api/transporte/logout", { method: "POST" });
          router.refresh();
        }}
      >
        Salir
      </button>
    </div>
  );
}
