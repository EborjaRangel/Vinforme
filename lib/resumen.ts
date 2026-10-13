import type { Invitado, ResumenAsistencia } from "@/lib/types";

export function resumir(lista: Invitado[]): ResumenAsistencia {
  const enEvento = lista.filter((persona) => persona.llego).length;
  return {
    registrados: lista.length,
    enEvento,
    porLlegar: lista.length - enEvento,
  };
}
