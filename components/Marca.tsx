import Link from "next/link";
import { Coyote } from "@/components/Coyote";

export function Marca() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3 text-tinta no-underline">
      <Coyote className="h-14 w-14 shrink-0" />
      <span className="leading-none">
        <span className="block text-[0.68rem] font-semibold tracking-[0.22em] text-tinta-suave">ALCALDÍA</span>
        <span className="block text-2xl font-black tracking-tight sm:text-[1.7rem]">
          <span className="text-azul">coyo</span>
          <span className="text-rojo">acá</span>
          <span className="text-oro">n</span>
        </span>
        <span className="block text-[0.68rem] font-semibold tracking-[0.12em] text-tinta-suave">V INFORME DE GOBIERNO</span>
      </span>
    </Link>
  );
}
