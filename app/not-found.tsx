import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="pagina contenedor">
      <p className="kicker">V Informe de Gobierno</p>
      <h1>No encontramos esa página</h1>
      <p className="lead">El enlace no corresponde a un registro o a una sección de este sistema.</p>
      <Link className="boton" href="/">
        Volver al inicio
      </Link>
    </div>
  );
}
