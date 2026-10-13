"use client";

import { useFormik, type FormikProps } from "formik";
import { useRouter } from "next/navigation";
import { useState, type FocusEvent } from "react";
import { formatearTelefono, telefonoDiez } from "@/lib/telefono";
import type { ValoresRegistro } from "@/lib/types";
import { esquemaRegistro } from "@/lib/validacion";

const iniciales: ValoresRegistro = {
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  telefono: "",
  institucion: "",
  correo: "",
  acepta: false,
};

type CampoTexto = Exclude<keyof ValoresRegistro, "acepta">;

export function FormularioRegistro() {
  const router = useRouter();
  const [sitioWeb, setSitioWeb] = useState("");
  const formik = useFormik<ValoresRegistro>({
    initialValues: iniciales,
    validationSchema: esquemaRegistro,
    onSubmit: async (valores, helpers) => {
      helpers.setStatus("");
      try {
        const respuesta = await fetch("/api/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...valores, sitioWeb }),
        });
        const datos = (await respuesta.json()) as { ok: boolean; mensaje?: string; slug?: string };
        if (!respuesta.ok || !datos.slug) {
          helpers.setStatus(datos.mensaje ?? "No fue posible completar el registro.");
          return;
        }
        router.push(`/confirmacion/${datos.slug}`);
      } catch {
        helpers.setStatus("No fue posible enviar el registro. Revisa tu conexión e intenta de nuevo.");
      }
    },
  });

  return (
    <form className="formulario" onSubmit={formik.handleSubmit} noValidate>
      <div className="rejilla-form">
        <Campo id="nombre" nombre="nombre" etiqueta="Nombre" autoComplete="given-name" formik={formik} />
        <Campo id="primerApellido" nombre="primerApellido" etiqueta="Primer apellido" autoComplete="family-name" formik={formik} />
        <Campo
          id="segundoApellido"
          nombre="segundoApellido"
          etiqueta="Segundo apellido"
          autoComplete="additional-name"
          formik={formik}
        />
        <Campo
          id="telefono"
          nombre="telefono"
          etiqueta="Teléfono celular"
          tipo="tel"
          autoComplete="tel"
          inputMode="tel"
          formik={formik}
          alSalir={(valor) => {
            const diez = telefonoDiez(valor);
            if (diez.length === 10) void formik.setFieldValue("telefono", formatearTelefono(diez));
          }}
        />
        <Campo
          id="institucion"
          nombre="institucion"
          etiqueta="Institución, gobierno de referencia, puesto o cargo"
          autoComplete="organization"
          formik={formik}
          area
          ancho
        />
        <Campo
          id="correo"
          nombre="correo"
          etiqueta="Correo electrónico"
          tipo="email"
          autoComplete="email"
          inputMode="email"
          formik={formik}
          ancho
        />
      </div>

      <label className="acepta">
        <input
          type="checkbox"
          name="acepta"
          checked={formik.values.acepta}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <span>
          Autorizo el uso de estos datos únicamente para confirmar mi asistencia y controlar el acceso al V Informe de
          Gobierno de Coyoacán.
        </span>
      </label>
      {formik.touched.acepta && formik.errors.acepta ? <small className="error">{formik.errors.acepta}</small> : null}

      <input
        className="trampa"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="sitioWeb"
        value={sitioWeb}
        onChange={(evento) => setSitioWeb(evento.target.value)}
      />

      {formik.status ? (
        <p className="aviso-error" role="alert">
          {formik.status}
        </p>
      ) : null}

      <div className="acciones">
        <button className="boton" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "Registrando…" : "Confirmar asistencia"}
        </button>
      </div>
    </form>
  );
}

function Campo({
  id,
  nombre,
  etiqueta,
  formik,
  tipo = "text",
  autoComplete,
  inputMode,
  area = false,
  ancho = false,
  alSalir,
}: {
  id: string;
  nombre: CampoTexto;
  etiqueta: string;
  formik: FormikProps<ValoresRegistro>;
  tipo?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  area?: boolean;
  ancho?: boolean;
  alSalir?: (valor: string) => void;
}) {
  const error = formik.touched[nombre] && formik.errors[nombre] ? String(formik.errors[nombre]) : "";
  const comunes = {
    id,
    name: nombre,
    value: formik.values[nombre],
    onChange: formik.handleChange,
    onBlur: (evento: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      formik.handleBlur(evento);
      alSalir?.(evento.target.value);
    },
    autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  return (
    <label className={ancho ? "campo campo-ancho" : "campo"} htmlFor={id}>
      <span>{etiqueta}</span>
      {area ? <textarea {...comunes} rows={3} /> : <input {...comunes} type={tipo} inputMode={inputMode} />}
      {error ? (
        <small className="error" id={`${id}-error`}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
