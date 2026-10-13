import { randomUUID } from "crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { consultar, conTransaccion } from "@/lib/db";
import { claveDeNombre, slugDeNombre } from "@/lib/nombres";
import { telefonoDiez } from "@/lib/telefono";
import type { CanalAviso, Invitado, Notificacion, ResumenAsistencia, ValoresRegistro } from "@/lib/types";

type Fila = QueryResultRow & {
  id: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  nombre_completo: string;
  clave: string;
  slug: string;
  telefono: string;
  institucion: string;
  correo: string;
  registrado_en: Date;
  llego: boolean;
  llegada_en: Date | null;
  notif_correo: CanalAviso;
  notif_sms: CanalAviso;
  notif_correo_detalle: string;
  notif_sms_detalle: string;
};

const COLUMNAS = `
  id, nombre, primer_apellido, segundo_apellido, nombre_completo, clave, slug,
  telefono, institucion, correo, registrado_en, llego, llegada_en,
  notif_correo, notif_sms, notif_correo_detalle, notif_sms_detalle
`;

function aInvitado(fila: Fila): Invitado {
  return {
    id: fila.id,
    nombre: fila.nombre,
    primerApellido: fila.primer_apellido,
    segundoApellido: fila.segundo_apellido,
    nombreCompleto: fila.nombre_completo,
    clave: fila.clave,
    slug: fila.slug,
    telefono: fila.telefono,
    institucion: fila.institucion,
    correo: fila.correo,
    registradoEn: new Date(fila.registrado_en).toISOString(),
    llego: fila.llego,
    llegadaEn: fila.llegada_en ? new Date(fila.llegada_en).toISOString() : null,
    notificacion: {
      correo: fila.notif_correo,
      sms: fila.notif_sms,
      correoDetalle: fila.notif_correo_detalle,
      smsDetalle: fila.notif_sms_detalle,
    },
  };
}

export class ErrorRegistro extends Error {
  codigo: "DUPLICADO" | "SLUG";

  constructor(codigo: "DUPLICADO" | "SLUG", mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function errorUnico(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  if ((error as { code?: string }).code !== "23505") return null;
  const restriccion = String((error as { constraint?: string }).constraint ?? "");
  if (restriccion.includes("slug")) {
    return new ErrorRegistro(
      "SLUG",
      "Ya existe un pase con un nombre que produce el mismo código. Revisa acentos y espacios.",
    );
  }
  return new ErrorRegistro(
    "DUPLICADO",
    "Ya existe un registro con ese nombre completo. El pase es personal y no puede repetirse.",
  );
}

async function conteo(cliente: PoolClient): Promise<ResumenAsistencia> {
  const resultado = await cliente.query<{ registrados: number; en_evento: number }>(
    `SELECT COUNT(*)::int AS registrados, COUNT(*) FILTER (WHERE llego)::int AS en_evento FROM invitados`,
  );
  const fila = resultado.rows[0];
  const registrados = fila?.registrados ?? 0;
  const enEvento = fila?.en_evento ?? 0;
  return { registrados, enEvento, porLlegar: registrados - enEvento };
}

export async function listarInvitados() {
  const resultado = await consultar<Fila>(`SELECT ${COLUMNAS} FROM invitados ORDER BY registrado_en ASC`);
  return resultado.rows.map(aInvitado);
}

export async function obtenerPorSlug(slug: string) {
  const resultado = await consultar<Fila>(`SELECT ${COLUMNAS} FROM invitados WHERE slug = $1`, [slug]);
  return resultado.rows[0] ? aInvitado(resultado.rows[0]) : null;
}

export async function crearInvitado(datos: ValoresRegistro) {
  const clave = claveDeNombre(datos.nombre, datos.primerApellido, datos.segundoApellido);
  const slug = slugDeNombre(datos.nombre, datos.primerApellido, datos.segundoApellido);

  if (!slug) {
    throw new ErrorRegistro("SLUG", "El nombre no genera un código de acceso válido.");
  }

  const existente = await consultar<{ clave: string; slug: string }>(
    `SELECT clave, slug FROM invitados WHERE clave = $1 OR slug = $2`,
    [clave, slug],
  );
  if (existente.rows.some((fila) => fila.clave === clave)) {
    throw new ErrorRegistro(
      "DUPLICADO",
      "Ya existe un registro con ese nombre completo. El pase es personal y no puede repetirse.",
    );
  }
  if (existente.rows.some((fila) => fila.slug === slug)) {
    throw new ErrorRegistro(
      "SLUG",
      "Ya existe un pase con un nombre que produce el mismo código. Revisa acentos y espacios.",
    );
  }

  const invitado: Invitado = {
    id: randomUUID(),
    nombre: datos.nombre,
    primerApellido: datos.primerApellido,
    segundoApellido: datos.segundoApellido,
    nombreCompleto: [datos.nombre, datos.primerApellido, datos.segundoApellido].join(" "),
    clave,
    slug,
    telefono: telefonoDiez(datos.telefono),
    institucion: datos.institucion,
    correo: datos.correo,
    registradoEn: new Date().toISOString(),
    llego: false,
    llegadaEn: null,
    notificacion: {
      correo: "no_configurado",
      sms: "no_configurado",
      correoDetalle: "",
      smsDetalle: "",
    },
  };

  try {
    await consultar(
      `INSERT INTO invitados (
        id, nombre, primer_apellido, segundo_apellido, nombre_completo, clave, slug,
        telefono, institucion, correo, registrado_en, llego, llegada_en,
        notif_correo, notif_sms, notif_correo_detalle, notif_sms_detalle
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17
      )`,
      [
        invitado.id,
        invitado.nombre,
        invitado.primerApellido,
        invitado.segundoApellido,
        invitado.nombreCompleto,
        invitado.clave,
        invitado.slug,
        invitado.telefono,
        invitado.institucion,
        invitado.correo,
        invitado.registradoEn,
        invitado.llego,
        invitado.llegadaEn,
        invitado.notificacion.correo,
        invitado.notificacion.sms,
        invitado.notificacion.correoDetalle,
        invitado.notificacion.smsDetalle,
      ],
    );
  } catch (error) {
    const unico = errorUnico(error);
    if (unico) throw unico;
    throw error;
  }

  return invitado;
}

export async function guardarNotificacion(id: string, notificacion: Notificacion) {
  const resultado = await consultar<Fila>(
    `UPDATE invitados
     SET notif_correo = $2, notif_sms = $3, notif_correo_detalle = $4, notif_sms_detalle = $5
     WHERE id = $1
     RETURNING ${COLUMNAS}`,
    [id, notificacion.correo, notificacion.sms, notificacion.correoDetalle, notificacion.smsDetalle],
  );
  return resultado.rows[0] ? aInvitado(resultado.rows[0]) : null;
}

export async function buscarPorIdentidad(clave: string, correo: string) {
  const resultado = await consultar<Fila>(
    `SELECT ${COLUMNAS} FROM invitados WHERE clave = $1 AND correo = $2`,
    [clave, correo],
  );
  return resultado.rows[0] ? aInvitado(resultado.rows[0]) : null;
}

export async function marcarAsistencia(slug: string, accion: "llegada" | "revertir") {
  return conTransaccion(async (cliente) => {
    const resultado = await cliente.query<Fila>(`SELECT ${COLUMNAS} FROM invitados WHERE slug = $1 FOR UPDATE`, [slug]);
    const fila = resultado.rows[0];
    if (!fila) return null;

    const persona = aInvitado(fila);
    const yaEstaba = persona.llego;
    let cambio = false;

    if (accion === "llegada" && !persona.llego) {
      persona.llego = true;
      persona.llegadaEn = new Date().toISOString();
      cambio = true;
    }

    if (accion === "revertir" && (persona.llego || persona.llegadaEn)) {
      persona.llego = false;
      persona.llegadaEn = null;
      cambio = true;
    }

    if (cambio) {
      await cliente.query(`UPDATE invitados SET llego = $2, llegada_en = $3 WHERE id = $1`, [
        persona.id,
        persona.llego,
        persona.llegadaEn,
      ]);
    }

    return {
      invitado: persona,
      yaEstaba,
      resumen: await conteo(cliente),
    };
  });
}
