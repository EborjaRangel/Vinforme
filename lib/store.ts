import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { claveDeNombre, slugDeNombre } from "@/lib/nombres";
import { resumir } from "@/lib/resumen";
import { telefonoDiez } from "@/lib/telefono";
import type { Invitado, Notificacion, ValoresRegistro } from "@/lib/types";

const archivo = path.join(process.cwd(), "data", "invitados.json");

let cola: Promise<unknown> = Promise.resolve();

function enCola<T>(trabajo: () => Promise<T>): Promise<T> {
  const resultado = cola.then(trabajo, trabajo);
  cola = resultado.then(
    () => undefined,
    () => undefined,
  );
  return resultado;
}

async function leerArchivo(): Promise<Invitado[]> {
  try {
    const texto = await fs.readFile(archivo, "utf8");
    const datos: unknown = JSON.parse(texto);
    return Array.isArray(datos) ? (datos as Invitado[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function guardarArchivo(lista: Invitado[]) {
  await fs.mkdir(path.dirname(archivo), { recursive: true });
  await fs.writeFile(archivo, JSON.stringify(lista, null, 2), "utf8");
}

export function listarInvitados() {
  return enCola(leerArchivo);
}

export function obtenerPorSlug(slug: string) {
  return enCola(async () => {
    const lista = await leerArchivo();
    return lista.find((persona) => persona.slug === slug) ?? null;
  });
}

export class ErrorRegistro extends Error {
  codigo: "DUPLICADO" | "SLUG";

  constructor(codigo: "DUPLICADO" | "SLUG", mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

export function crearInvitado(datos: ValoresRegistro) {
  return enCola(async () => {
    const lista = await leerArchivo();
    const clave = claveDeNombre(datos.nombre, datos.primerApellido, datos.segundoApellido);
    const slug = slugDeNombre(datos.nombre, datos.primerApellido, datos.segundoApellido);

    if (!slug) {
      throw new ErrorRegistro("SLUG", "El nombre no genera un código de acceso válido.");
    }

    if (lista.some((persona) => persona.clave === clave)) {
      throw new ErrorRegistro(
        "DUPLICADO",
        "Ya existe un registro con ese nombre completo. El pase es personal y no puede repetirse.",
      );
    }

    if (lista.some((persona) => persona.slug === slug)) {
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

    lista.push(invitado);
    await guardarArchivo(lista);
    return structuredClone(invitado);
  });
}

export function guardarNotificacion(id: string, notificacion: Notificacion) {
  return enCola(async () => {
    const lista = await leerArchivo();
    const persona = lista.find((item) => item.id === id);
    if (!persona) return null;
    persona.notificacion = notificacion;
    await guardarArchivo(lista);
    return structuredClone(persona);
  });
}

export function buscarPorIdentidad(clave: string, correo: string) {
  return enCola(async () => {
    const lista = await leerArchivo();
    return lista.find((persona) => persona.clave === clave && persona.correo === correo) ?? null;
  });
}

export function marcarAsistencia(slug: string, accion: "llegada" | "revertir") {
  return enCola(async () => {
    const lista = await leerArchivo();
    const persona = lista.find((item) => item.slug === slug);
    if (!persona) return null;

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

    if (cambio) await guardarArchivo(lista);

    return {
      invitado: structuredClone(persona),
      yaEstaba,
      resumen: resumir(lista),
    };
  });
}
