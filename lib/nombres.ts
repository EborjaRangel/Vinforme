export function limpiarTexto(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
}

export function sinAcentos(valor: string) {
  return valor
    .replace(/ñ/gi, "n")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function armarNombreCompleto(nombre: string, primerApellido: string, segundoApellido: string) {
  return [nombre, primerApellido, segundoApellido].map(limpiarTexto).filter(Boolean).join(" ");
}

export function claveDeNombre(nombre: string, primerApellido: string, segundoApellido: string) {
  return [nombre, primerApellido, segundoApellido].map((parte) => sinAcentos(limpiarTexto(parte))).join("|");
}

export function slugDeNombre(nombre: string, primerApellido: string, segundoApellido: string) {
  return [nombre, primerApellido, segundoApellido]
    .map((parte) =>
      sinAcentos(limpiarTexto(parte))
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("-");
}

export function slugValido(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function corto(valor: string, maximo: number) {
  const limpio = limpiarTexto(valor);
  if (limpio.length <= maximo) return limpio;
  return `${limpio.slice(0, maximo - 1)}…`;
}
