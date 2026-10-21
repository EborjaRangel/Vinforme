type Cuenta = {
  usuario: string;
  nombre: string;
  es_admin: boolean;
  clave_visible?: string;
};

export function TablaCuentas({ cuentas }: { cuentas: Cuenta[] }) {
  if (cuentas.length === 0) {
    return <p>Todavía no hay otras cuentas de despacho.</p>;
  }

  return (
    <div className="grid gap-3">
      {cuentas.map((cuenta) => (
        <article className="persona" key={cuenta.usuario}>
          <h3>{cuenta.nombre}</h3>
          <p>Usuario: {cuenta.usuario}</p>
          <p>Tipo: {cuenta.es_admin ? "Administrador" : "Despacho"}</p>
          <p>Contraseña: {cuenta.clave_visible || "No quedó registrada. Da de alta de nuevo con otro usuario."}</p>
        </article>
      ))}
    </div>
  );
}
