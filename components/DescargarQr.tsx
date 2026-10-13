"use client";

export function DescargarQr({ href, archivo }: { href: string; archivo: string }) {
  async function descargarPng() {
    const texto = await fetch(href).then((respuesta) => respuesta.text());
    const blob = new Blob([texto], { type: "image/svg+xml;charset=utf-8" });
    const objeto = URL.createObjectURL(blob);

    try {
      const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
        const elemento = new Image();
        elemento.onload = () => resolve(elemento);
        elemento.onerror = () => reject(new Error("No se pudo preparar la imagen."));
        elemento.src = objeto;
      });

      const lienzo = document.createElement("canvas");
      const tamano = 1400;
      lienzo.width = tamano;
      lienzo.height = tamano;
      const contexto = lienzo.getContext("2d");
      if (!contexto) return;
      contexto.fillStyle = "#ffffff";
      contexto.fillRect(0, 0, tamano, tamano);
      contexto.drawImage(imagen, 0, 0, tamano, tamano);

      const png = await new Promise<Blob | null>((resolve) => lienzo.toBlob(resolve, "image/png"));
      if (!png) return;
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(png);
      enlace.download = archivo;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } finally {
      URL.revokeObjectURL(objeto);
    }
  }

  return (
    <div className="acciones">
      <a className="boton" href={href} download={`${archivo}.svg`}>
        Descargar SVG
      </a>
      <button className="boton-secundario" type="button" onClick={() => void descargarPng()}>
        Descargar PNG
      </button>
    </div>
  );
}
