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

  CREATE TABLE IF NOT EXISTS usuarios_transporte (
    id TEXT PRIMARY KEY,
    usuario TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    clave_hash TEXT NOT NULL,
    es_admin BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL,
    clave_visible TEXT NOT NULL DEFAULT ''
  );

  ALTER TABLE usuarios_transporte ADD COLUMN IF NOT EXISTS clave_visible TEXT NOT NULL DEFAULT '';

  CREATE TABLE IF NOT EXISTS dirigentes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    primer_apellido TEXT NOT NULL DEFAULT '',
    segundo_apellido TEXT NOT NULL DEFAULT '',
    nombre_completo TEXT NOT NULL,
    telefono TEXT NOT NULL DEFAULT '',
    colonia TEXT NOT NULL DEFAULT '',
    seccion TEXT NOT NULL DEFAULT '',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    estatus TEXT NOT NULL DEFAULT '',
    actualizado_en TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS sincronizaciones (
    clave TEXT PRIMARY KEY,
    en TIMESTAMPTZ NOT NULL
  );

  CREATE TABLE IF NOT EXISTS despachos (
    id TEXT PRIMARY KEY,
    dirigente_id TEXT NOT NULL REFERENCES dirigentes(id),
    tipo TEXT NOT NULL,
    placas TEXT NOT NULL,
    chofer_nombre TEXT NOT NULL,
    chofer_telefono TEXT NOT NULL,
    contacto_nombre TEXT NOT NULL,
    contacto_telefono TEXT NOT NULL,
    ida_vuelta BOOLEAN NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    lugar_texto TEXT NOT NULL DEFAULT '',
    entregado_en TIMESTAMPTZ NOT NULL,
    foto_tipo TEXT NOT NULL,
    foto BYTEA NOT NULL,
    usuario_id TEXT,
    creado_en TIMESTAMPTZ NOT NULL
  );

  CREATE INDEX IF NOT EXISTS despachos_dirigente ON despachos (dirigente_id);
  CREATE INDEX IF NOT EXISTS despachos_entregado ON despachos (entregado_en DESC);
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
