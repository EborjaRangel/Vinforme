"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navegacion } from "@/lib/navegacion";

export function NavCliente() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setAbierto(false);
  }, [ruta]);

  return (
    <div className="relative ml-auto">
      <button
        className="inline-flex min-h-11 items-center rounded-md bg-papel px-3 text-sm font-bold text-tinta md:hidden"
        type="button"
        aria-expanded={abierto}
        aria-controls="menu-principal"
        onClick={() => setAbierto((valor) => !valor)}
      >
        Menú
      </button>
      <nav
        id="menu-principal"
        aria-label="Menú principal"
        className={
          abierto
            ? "absolute top-[calc(100%+0.6rem)] right-0 z-40 flex w-64 flex-col rounded-lg border border-linea bg-white p-2 shadow-lg md:static md:w-auto md:flex-row md:border-0 md:bg-transparent md:p-0 md:shadow-none"
            : "hidden md:flex md:items-center md:gap-1"
        }
      >
        {navegacion.map((item) => {
          const activo = item.href === "/" ? ruta === "/" : ruta.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href === "/transporte" ? false : undefined}
              aria-current={activo ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold no-underline ${
                activo ? "text-azul underline decoration-rojo decoration-2 underline-offset-8" : "text-tinta hover:text-azul"
              }`}
            >
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
