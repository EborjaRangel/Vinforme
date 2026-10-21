import * as yup from "yup";
import { telefonoDiez } from "@/lib/telefono";
import type { ValoresRegistro } from "@/lib/types";

const letras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '’.-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

function texto(minimo: number, maximo: number) {
  return yup
    .string()
    .transform((valor) => (typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : valor))
    .required("Este campo es obligatorio.")
    .min(minimo, `Escribe al menos ${minimo} caracteres.`)
    .max(maximo, `Usa como máximo ${maximo} caracteres.`);
}

function nombrePersona(etiqueta: string) {
  return texto(2, 60).matches(letras, `${etiqueta} solo puede incluir letras, espacios, apóstrofos o guiones.`);
}

export const esquemaRegistro: yup.ObjectSchema<ValoresRegistro> = yup.object({
  nombre: nombrePersona("El nombre"),
  primerApellido: nombrePersona("El primer apellido"),
  segundoApellido: nombrePersona("El segundo apellido"),
  telefono: yup
    .string()
    .transform((valor) => (typeof valor === "string" ? valor.trim() : valor))
    .required("El teléfono es obligatorio.")
    .test("diez-digitos", "Ingresa un celular de 10 dígitos.", (valor) => telefonoDiez(valor ?? "").length === 10),
  institucion: texto(3, 160),
  correo: yup
    .string()
    .transform((valor) => (typeof valor === "string" ? valor.trim().toLowerCase() : valor))
    .required("El correo electrónico es obligatorio.")
    .email("Ingresa un correo electrónico válido.")
    .max(120, "El correo es demasiado largo."),
  acepta: yup.boolean().oneOf([true], "Debes autorizar el uso de tus datos para continuar.").required(),
});

const telefonoObligatorio = (mensaje: string) =>
  yup
    .string()
    .transform((valor) => (typeof valor === "string" ? valor.trim() : valor))
    .required(mensaje)
    .test("diez-digitos", "Ingresa un celular de 10 dígitos.", (valor) => telefonoDiez(valor ?? "").length === 10);

export const esquemaRecuperacion = yup.object({
  telefono: telefonoObligatorio("Ingresa el celular de 10 dígitos con el que te registraste."),
});

export const esquemaClave = yup.object({
  clave: yup.string().trim().required("La clave es obligatoria."),
});

export const esquemaLoginTransporte = yup.object({
  usuario: yup.string().trim().required("El usuario es obligatorio.").min(3, "El usuario debe tener al menos 3 caracteres.").max(40),
  clave: yup.string().required("La contraseña es obligatoria.").min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const esquemaAltaDespacho = yup.object({
  nombre: texto(3, 80),
  usuario: yup
    .string()
    .transform((valor) => (typeof valor === "string" ? valor.trim().toLowerCase() : valor))
    .required("El usuario es obligatorio.")
    .matches(/^[a-z0-9._-]{3,40}$/, "El usuario debe tener entre 3 y 40 letras o números."),
  clave: yup.string().required("La contraseña es obligatoria.").min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const esquemaDespacho = yup.object({
  dirigenteId: yup.string().trim().required("Elige el dirigente."),
  tipo: yup
    .string()
    .oneOf(["camion", "microbus", "van"], "Elige el tipo de transporte.")
    .required("Elige el tipo de transporte."),
  placas: yup
    .string()
    .transform((valor) => (typeof valor === "string" ? valor.trim().toUpperCase().replace(/\s+/g, "") : valor))
    .required("Escribe las placas del transporte.")
    .min(5, "Escribe las placas del transporte.")
    .max(12, "Las placas son demasiado largas."),
  choferNombre: texto(3, 80),
  choferTelefono: telefonoObligatorio("El teléfono del chofer debe tener 10 dígitos."),
  idaVuelta: yup.string().oneOf(["si", "no"], "Indica si es ida y vuelta.").required("Indica si es ida y vuelta."),
  lat: yup
    .string()
    .required("Toma la ubicación en el punto donde entregas la unidad.")
    .test("latitud", "Toma la ubicación en el punto donde entregas la unidad.", (valor) => {
      const numero = Number(valor);
      return Number.isFinite(numero) && Math.abs(numero) <= 90;
    }),
  lng: yup
    .string()
    .required("Toma la ubicación en el punto donde entregas la unidad.")
    .test("longitud", "Toma la ubicación en el punto donde entregas la unidad.", (valor) => {
      const numero = Number(valor);
      return Number.isFinite(numero) && Math.abs(numero) <= 180;
    }),
  foto: yup
    .mixed<File>()
    .nullable()
    .test("archivo", "Toma la foto del transporte.", (valor) => valor instanceof File && valor.size > 0)
    .test("imagen", "La foto debe ser una imagen.", (valor) => !(valor instanceof File) || valor.type.startsWith("image/")),
});
