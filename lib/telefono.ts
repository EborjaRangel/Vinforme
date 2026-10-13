export function telefonoDiez(valor: string) {
  let digitos = valor.replace(/\D/g, "");
  if (digitos.length === 13 && digitos.startsWith("521")) digitos = digitos.slice(3);
  if (digitos.length === 12 && digitos.startsWith("52")) digitos = digitos.slice(2);
  return digitos;
}

export function formatearTelefono(valor: string) {
  const digitos = telefonoDiez(valor);
  if (digitos.length !== 10) return valor;
  return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6)}`;
}

export function telefonoInternacional(valor: string) {
  return `+52${telefonoDiez(valor)}`;
}
