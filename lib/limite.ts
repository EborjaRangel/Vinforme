const ventanas = new Map<string, number[]>();

export function solicitudLimitada(ip: string, maximo = 80, ventanaMs = 15 * 60 * 1000) {
  const ahora = Date.now();
  const previas = (ventanas.get(ip) ?? []).filter((marca) => ahora - marca < ventanaMs);
  if (previas.length >= maximo) return true;
  previas.push(ahora);
  ventanas.set(ip, previas);
  return false;
}

export function ipDe(request: Request) {
  const encabezado = request.headers.get("x-forwarded-for");
  if (encabezado) return encabezado.split(",")[0]?.trim() || "local";
  return "local";
}
