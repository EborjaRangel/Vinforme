import type { Metadata, Viewport } from "next";
import { NavCliente } from "@/components/NavCliente";
import { Marca } from "@/components/Marca";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "V Informe de Gobierno · Coyoacán",
    template: "%s · V Informe Coyoacán",
  },
  description: "Registro, confirmación y control de acceso del V Informe de Gobierno de la Alcaldía Coyoacán.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00A0DF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              try {
                var ruta = location.pathname;
                if (ruta.indexOf("/confirmacion") === 0 || ruta.indexOf("/llegada") === 0) return;
                if (ruta === "/") {
                  sessionStorage.setItem("informe-arranque", "1");
                  return;
                }
                if (!sessionStorage.getItem("informe-arranque")) {
                  sessionStorage.setItem("informe-arranque", "1");
                  location.replace("/");
                }
              } catch (error) {}
            })();`,
          }}
        />
        <a className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:text-azul" href="#contenido">
          Saltar al contenido
        </a>
        <header className="sticky top-0 z-30 border-b border-linea bg-white">
          <div className="grid h-1.5 grid-cols-3" aria-hidden="true">
            <span className="bg-azul" />
            <span className="bg-white" />
            <span className="bg-rojo" />
          </div>
          <div className="h-1 bg-oro" aria-hidden="true" />
          <div className="mx-auto flex min-h-[4.75rem] w-[min(1120px,calc(100%-2rem))] items-center gap-4">
            <Marca />
            <NavCliente />
          </div>
        </header>
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <footer className="mt-16 border-t border-linea bg-white">
          <div className="mx-auto grid w-[min(1120px,calc(100%-2rem))] gap-6 py-8">
            <div>
              <Marca />
              <p className="mt-3 text-tinta-suave">Sistema de confirmación de asistencia y control de acceso.</p>
            </div>
            <p className="border-t border-linea pt-4 text-sm text-tinta-suave">
              Los datos de este registro se usan únicamente para confirmar la asistencia y controlar el ingreso al V Informe
              de Gobierno de Coyoacán.
            </p>
          </div>
          <div className="grid h-1.5 grid-cols-3" aria-hidden="true">
            <span className="bg-azul" />
            <span className="bg-white" />
            <span className="bg-rojo" />
          </div>
        </footer>
      </body>
    </html>
  );
}
