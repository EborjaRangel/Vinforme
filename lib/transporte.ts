import { randomUUID } from "crypto";
import { Pool } from "pg";
import { consultar } from "@/lib/db";
import { hashClave } from "@/lib/transporte-auth";
import { telefonoDiez } from "@/lib/telefono";

export type DirigenteLista = {
  id: string;
  nombreCompleto: string;
  telefono: string;
  colonia: string;
  seccion: string;
  activo: boolean;
};

export type DespachoLista = {
  id: string;
  dirigenteId: string;
  dirigente: string;
  tipo: "camion" | "microbus" | "van";
  placas: string;
  choferNombre: string;
  choferTelefono: string;
  contactoNombre: string;
  contactoTelefono: string;
  idaVuelta: boolean;
  lat: number;
  lng: number;
  lugarTexto: string;
  entregadoEn: string;
};

const globalForControl = globalThis as unknown as { poolControl?: Pool };

function poolControl() {
  const conexion = process.env.CONTROL_DATABASE_URL;
  if (!conexion) return null;
  if (!globalForControl.poolControl) {
    globalForControl.poolControl = new Pool({
      connectionString: conexion,
      ssl: /localhost|127\.0\.0\.1|\.internal/i.test(conexion) ? undefined : { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 15_000,
    });
  }
  return globalForControl.poolControl;
}

export async function asegurarUsuarioInicial() {
  const usuario = (process.env.TRANSPORTE_USUARIO || "despacho").trim().toLowerCase();
  const clave = process.env.TRANSPORTE_PASSWORD || (process.env.NODE_ENV !== "production" ? "despacho-informe" : "");
  if (!clave) return;
  const existe = await consultar(`SELECT id FROM usuarios_transporte WHERE usuario = $1`, [usuario]);
  if (existe.rows.length > 0) return;
  await consultar(
    `INSERT INTO usuarios_transporte (id, usuario, nombre, clave_hash, es_admin, activo, creado_en)
     VALUES ($1, $2, $3, $4, TRUE, TRUE, $5)`,
    [randomUUID(), usuario, "Despacho", hashClave(clave), new Date().toISOString()],
  );
}

export async function sincronizarDirigentes(forzar = false) {
  const pool = poolControl();
  if (!pool) return { ok: false as const, motivo: "Falta CONTROL_DATABASE_URL." };

  if (!forzar) {
    const marca = await consultar<{ en: Date }>(`SELECT en FROM sincronizaciones WHERE clave = 'dirigentes'`);
    const ultima = marca.rows[0]?.en ? new Date(marca.rows[0].en).getTime() : 0;
    if (Date.now() - ultima < 10 * 60 * 1000) return { ok: true as const, motivo: "reciente" };
  }

  const origen = await pool.query<{
    id: string;
    nombre: string;
    primerApellido: string | null;
    segundoApellido: string | null;
    telefonoCelular: string | null;
    colonia: string | null;
    seccionElectoral: string | null;
    activo: boolean;
    estatus: string | null;
    updatedAt: Date | null;
  }>(`
    SELECT id, nombre, "primerApellido", "segundoApellido", "telefonoCelular",
           colonia, "seccionElectoral", activo, status::text AS estatus, "updatedAt"
    FROM "Dirigente"
  `);

  const filas = origen.rows;
  for (let inicio = 0; inicio < filas.length; inicio += 100) {
    const lote = filas.slice(inicio, inicio + 100);
    const valores: unknown[] = [];
    const grupos = lote.map((fila, indice) => {
      const base = indice * 11;
      const nombre = fila.nombre?.trim() || "Sin nombre";
      const primer = fila.primerApellido?.trim() || "";
      const segundo = fila.segundoApellido?.trim() || "";
      valores.push(
        fila.id,
        nombre,
        primer,
        segundo,
        [nombre, primer, segundo].filter(Boolean).join(" "),
        telefonoDiez(fila.telefonoCelular || ""),
        fila.colonia?.trim() || "",
        fila.seccionElectoral?.trim() || "",
        Boolean(fila.activo),
        fila.estatus || "",
        fila.updatedAt ? new Date(fila.updatedAt).toISOString() : null,
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11})`;
    });
    await consultar(
      `INSERT INTO dirigentes (
         id, nombre, primer_apellido, segundo_apellido, nombre_completo, telefono, colonia, seccion, activo, estatus, actualizado_en
       ) VALUES ${grupos.join(", ")}
       ON CONFLICT (id) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         primer_apellido = EXCLUDED.primer_apellido,
         segundo_apellido = EXCLUDED.segundo_apellido,
         nombre_completo = EXCLUDED.nombre_completo,
         telefono = EXCLUDED.telefono,
         colonia = EXCLUDED.colonia,
         seccion = EXCLUDED.seccion,
         activo = EXCLUDED.activo,
         estatus = EXCLUDED.estatus,
         actualizado_en = EXCLUDED.actualizado_en`,
      valores,
    );
  }

  if (filas.length > 0) {
    await consultar(
      `DELETE FROM dirigentes
       WHERE NOT (id = ANY($1::text[]))
         AND id NOT IN (SELECT dirigente_id FROM despachos)`,
      [filas.map((fila) => fila.id)],
    );
  }

  await consultar(
    `INSERT INTO sincronizaciones (clave, en) VALUES ('dirigentes', NOW())
     ON CONFLICT (clave) DO UPDATE SET en = NOW()`,
  );
  return { ok: true as const, motivo: `${filas.length}` };
}

export async function listarDirigentes() {
  await sincronizarDirigentes(false).catch(() => undefined);
  const resultado = await consultar<{
    id: string;
    nombre_completo: string;
    telefono: string;
    colonia: string;
    seccion: string;
    activo: boolean;
  }>(
    `SELECT id, nombre_completo, telefono, colonia, seccion, activo
     FROM dirigentes
     ORDER BY activo DESC, nombre_completo ASC`,
  );
  return resultado.rows.map(
    (fila): DirigenteLista => ({
      id: fila.id,
      nombreCompleto: fila.nombre_completo,
      telefono: fila.telefono,
      colonia: fila.colonia,
      seccion: fila.seccion,
      activo: fila.activo,
    }),
  );
}

export async function listarDespachos() {
  const resultado = await consultar<{
    id: string;
    dirigente_id: string;
    dirigente: string;
    tipo: DespachoLista["tipo"];
    placas: string;
    chofer_nombre: string;
    chofer_telefono: string;
    contacto_nombre: string;
    contacto_telefono: string;
    ida_vuelta: boolean;
    lat: number;
    lng: number;
    lugar_texto: string;
    entregado_en: Date;
  }>(`
    SELECT d.id, d.dirigente_id, g.nombre_completo AS dirigente, d.tipo, d.placas,
           d.chofer_nombre, d.chofer_telefono, d.contacto_nombre, d.contacto_telefono,
           d.ida_vuelta, d.lat, d.lng, d.lugar_texto, d.entregado_en
    FROM despachos d
    JOIN dirigentes g ON g.id = d.dirigente_id
    ORDER BY d.entregado_en DESC
  `);
  return resultado.rows.map(
    (fila): DespachoLista => ({
      id: fila.id,
      dirigenteId: fila.dirigente_id,
      dirigente: fila.dirigente,
      tipo: fila.tipo,
      placas: fila.placas,
      choferNombre: fila.chofer_nombre,
      choferTelefono: fila.chofer_telefono,
      contactoNombre: fila.contacto_nombre,
      contactoTelefono: fila.contacto_telefono,
      idaVuelta: fila.ida_vuelta,
      lat: Number(fila.lat),
      lng: Number(fila.lng),
      lugarTexto: fila.lugar_texto,
      entregadoEn: new Date(fila.entregado_en).toISOString(),
    }),
  );
}

export async function lugarDesdeCoordenadas(lat: number, lng: number) {
  try {
    const respuesta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "VInformeCoyoacan/1.0 (transporte)",
          "Accept-Language": "es",
        },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!respuesta.ok) return "";
    const datos = (await respuesta.json()) as { display_name?: string };
    return String(datos.display_name ?? "").slice(0, 240);
  } catch {
    return "";
  }
}
