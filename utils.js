// Mapeamento de Meses
const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

/**
 * Retorna a data atual formatada por extenso.
 * Ex: 22 de abril de 2026
 */
export function gerarDataPorExtenso() {
  const data = new Date();
  return `${data.getDate()} de ${MESES_PT[data.getMonth()]} de ${data.getFullYear()}`;
}
