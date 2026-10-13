import QRCode from "qrcode";

function escaparXml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const NEGRO = "#000000";
const AZUL_RECUADRO = "#00A0DF";
const ROJO_PRI = "#E30613";
const AZUL_PAN = "#0039A6";

export async function qrConEtiqueta(contenido: string, linea1: string, linea2: string, titulo: string) {
  const svg = await QRCode.toString(contenido, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    color: { dark: NEGRO, light: "#FFFFFF" },
  });

  const coincidencia = svg.match(/viewBox=["']0 0 ([0-9.]+) ([0-9.]+)["']/);
  if (!coincidencia) return svg;

  const size = Number(coincidencia[1]);
  const ancho = size * 0.4;
  const alto = size * 0.16;
  const x = (size - ancho) / 2;
  const y = (size - alto) / 2;
  const radio = size * 0.012;

  const overlay = `
    <g shape-rendering="geometricPrecision">
      <title>${escaparXml(titulo)}</title>
      <rect x="${x}" y="${y}" width="${ancho}" height="${alto}" rx="${radio}" fill="${AZUL_RECUADRO}" stroke="${AZUL_PAN}" stroke-width="${size * 0.01}" />
      <text x="${size / 2}" y="${y + alto * 0.42}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="${alto * 0.28}" font-weight="700" fill="${ROJO_PRI}">${escaparXml(linea1)}</text>
      <text x="${size / 2}" y="${y + alto * 0.78}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="${alto * 0.26}" font-weight="700" fill="${AZUL_PAN}">${escaparXml(linea2)}</text>
    </g>
  `;

  const cierre = svg.lastIndexOf("</svg>");
  if (cierre < 0) return svg;
  return svg.slice(0, cierre) + overlay + svg.slice(cierre);
}

export function respuestaSvg(svg: string) {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
