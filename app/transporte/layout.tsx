import { asegurarUsuarioInicial } from "@/lib/transporte";

export default async function LayoutTransporte({ children }: { children: React.ReactNode }) {
  await asegurarUsuarioInicial();
  return children;
}
