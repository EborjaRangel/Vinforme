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

export const esquemaRecuperacion = yup.object({
  telefono: yup
    .string()
    .transform((valor) => (typeof valor === "string" ? valor.trim() : valor))
    .required("El teléfono es obligatorio.")
    .test("diez-digitos", "Ingresa el celular de 10 dígitos con el que te registraste.", (valor) => telefonoDiez(valor ?? "").length === 10),
});
