import { Pool, type PoolClient, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { poolInforme?: Pool };

function sslDe(conexion: string) {
  if (/localhost|127\.0\.0\.1|\.internal/i.test(conexion)) return undefined;
  return { rejectUnauthorized: false };
}

function pool() {
  const conexion = process.env.DATABASE_URL;
  if (!conexion) {
    throw new Error("Falta DATABASE_URL. Los registros viven en la base de Postgres de Railway.");
  }

  if (!globalForPg.poolInforme) {
    globalForPg.poolInforme = new Pool({
      connectionString: conexion,
      ssl: sslDe(conexion),
      max: process.env.VERCEL ? 1 : 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalForPg.poolInforme;
}

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS invitados (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    primer_apellido TEXT NOT NULL,
    segundo_apellido TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    clave TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    telefono TEXT NOT NULL,
    institucion TEXT NOT NULL,
    correo TEXT NOT NULL,
    registrado_en TIMESTAMPTZ NOT NULL,
    llego BOOLEAN NOT NULL DEFAULT FALSE,
    llegada_en TIMESTAMPTZ,
    notif_correo TEXT NOT NULL,
    notif_sms TEXT NOT NULL,
    notif_correo_detalle TEXT NOT NULL DEFAULT '',
    notif_sms_detalle TEXT NOT NULL DEFAULT ''
  );
`;

let esquema: Promise<void> | null = null;

export function asegurarEsquema() {
  if (!esquema) {
    esquema = pool()
      .query(ESQUEMA)
      .then(() => undefined)
      .catch((error: unknown) => {
        esquema = null;
        throw error;
      });
  }
  return esquema;
}

export async function consultar<T extends QueryResultRow>(texto: string, valores: unknown[] = []) {
  await asegurarEsquema();
  return pool().query<T>(texto, valores);
}

export async function conTransaccion<T>(trabajo: (cliente: PoolClient) => Promise<T>) {
  await asegurarEsquema();
  const cliente = await pool().connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await trabajo(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}
