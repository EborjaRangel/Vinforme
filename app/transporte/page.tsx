import type { Metadata } from "next";
import { LoginTransporte } from "@/components/LoginTransporte";
import { MenuTransporte } from "@/components/MenuTransporte";
import { TablaCuentas } from "@/components/TablaCuentas";
import { consultar } from "@/lib/db";
import { listarDespachos } from "@/lib/transporte";
import { sesionTransporte } from "@/lib/transporte-auth";

export const metadata: Metadata = { title: "Transporte" };
export const dynamic = "force-dynamic";

export default async function PaginaTransporte() {
  const sesion = await sesionTransporte();
  if (!sesion) return <LoginTransporte />;
  const usuario = await consultar<{ usuario: string; nombre: string }>(
    `SELECT usuario, nombre FROM usuarios_transporte WHERE id = $1`,
    [sesion.id],
  );
  const despachos = await listarDespachos().catch(() => []);
  const cuentas = sesion.esAdmin
    ? (
        await consultar<{ usuario: string; nombre: string; es_admin: boolean; clave_visible: string }>(
          `SELECT usuario, nombre, es_admin, clave_visible FROM usuarios_transporte ORDER BY es_admin DESC, nombre ASC`,
        )
      ).rows
    : [];
  const nombre = usuario.rows[0]?.nombre || usuario.rows[0]?.usuario || "Despacho";

  return (
    <section className="pagina contenedor">
      <p className="kicker">Transporte</p>
      <h1>Despacho de unidades</h1>
      <p className="lead">Hola, {nombre}. Desde aquí se entrega cada unidad y se asigna a un dirigente.</p>
      <MenuTransporte activo="inicio" esAdmin={sesion.esAdmin} />
      {sesion.esAdmin ? (
        <section>
          <h2>Cuentas</h2>
          <p className="lead">Usuarios, tipo y contraseña de quienes pueden despachar.</p>
          <TablaCuentas cuentas={cuentas} />
        </section>
      ) : null}
      <div className="metricas">
        <article className="tarjeta">
          <p className="kicker">Entregas</p>
          <h2>{despachos.length}</h2>
        </article>
      </div>
    </section>
  );
}
