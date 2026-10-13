export type CanalAviso = "enviado" | "no_configurado" | "error";

export type Notificacion = {
  correo: CanalAviso;
  sms: CanalAviso;
  correoDetalle: string;
  smsDetalle: string;
};

export type Invitado = {
  id: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  nombreCompleto: string;
  clave: string;
  slug: string;
  telefono: string;
  institucion: string;
  correo: string;
  registradoEn: string;
  llego: boolean;
  llegadaEn: string | null;
  notificacion: Notificacion;
};

export type ResumenAsistencia = {
  registrados: number;
  enEvento: number;
  porLlegar: number;
};

export type ValoresRegistro = {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  institucion: string;
  correo: string;
  acepta: boolean;
};
