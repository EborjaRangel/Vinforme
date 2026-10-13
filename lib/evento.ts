export const evento = {
  edicion: "V",
  nombre: "Informe de Gobierno",
  alcaldia: "Coyoacán",
  entidad: "Alcaldía Coyoacán",
  ciudad: "Ciudad de México",
  fecha: "Domingo 15 de noviembre",
  hora: "11:00 a.m.",
  lugar: "Estadio Azteca",
};

export const tituloEvento = `${evento.edicion} ${evento.nombre}`;
export const tituloCompleto = `${tituloEvento} de ${evento.alcaldia}`;
