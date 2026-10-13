export const evento = {
  edicion: "V",
  nombre: "Informe de Gobierno",
  alcaldia: "Coyoacán",
  entidad: "Alcaldía Coyoacán",
  ciudad: "Ciudad de México",
  fecha: "",
  hora: "",
  lugar: "",
};

export const tituloEvento = `${evento.edicion} ${evento.nombre}`;
export const tituloCompleto = `${tituloEvento} de ${evento.alcaldia}`;
