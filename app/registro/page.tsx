import type { Metadata } from "next";
import { FormularioRegistro } from "@/components/FormularioRegistro";
import { RecuperarPase } from "@/components/RecuperarPase";

export const metadata: Metadata = {
  title: "Confirmar asistencia",
};

export default function PaginaRegistro() {
  return (
    <div className="pagina contenedor">
      <p className="kicker">V Informe de Gobierno · Coyoacán</p>
      <h1>Confirmar asistencia</h1>
      <p className="lead">
        El pase se crea con tu nombre completo. Si ese nombre ya fue registrado, el sistema no permite un segundo pase.
      </p>
      <FormularioRegistro />
      <RecuperarPase />
    </div>
  );
}
