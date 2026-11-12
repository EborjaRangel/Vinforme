type Cuenta = {
  usuario: string;
  nombre: string;
  es_admin: boolean;
  activo?: boolean;
  clave_visible?: string;
};

export function TablaCuentas({
  cuentas,
  onEstado,
  ocupado,
}: {
  cuentas: Cuenta[];
  onEstado?: (usuario: string, activo: boolean) => void;
  ocupado?: string;
}) {
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
          <p>Estado: {cuenta.activo === false ? "Baja" : "Alta"}</p>
          <p>Contraseña: {cuenta.clave_visible || "No quedó registrada. Da de alta de nuevo con otro usuario."}</p>
          {onEstado && !cuenta.es_admin ? (
            <div className="acciones-fila">
              {cuenta.activo === false ? (
                <button
                  className="boton boton-pequeno"
                  type="button"
                  disabled={ocupado === cuenta.usuario}
                  onClick={() => onEstado(cuenta.usuario, true)}
                >
                  Dar de alta
                </button>
              ) : (
                <button
                  className="boton-peligro boton-pequeno"
                  type="button"
                  disabled={ocupado === cuenta.usuario}
                  onClick={() => onEstado(cuenta.usuario, false)}
                >
                  Dar de baja
                </button>
              )}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
