import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';


// --- Mapeamento de Meses ---
const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

function gerarDataPorExtenso() {
  const data = new Date();
  return `${data.getDate()} de ${MESES_PT[data.getMonth()]} de ${data.getFullYear()}`;
}

// --- Atualizar Data na UI ---
document.getElementById('currentDateString').textContent = gerarDataPorExtenso();

// --- Elementos Básicos ---
const form = document.getElementById('termForm');
const statusAlert = document.getElementById('statusAlert');
const statusText = statusAlert.querySelector('.text');
const successMessage = document.getElementById('successMessage');

const tipoTermoDropdown = document.getElementById('tipoTermo');
const nomeTecnicoContainer = document.getElementById('nomeTecnicoContainer');
const nomeTecnicoInput = document.getElementById('nomeTecnico');


// Buscar todos os inputs do tipo text, exceto o do técnico
const baseInputs = Array.from(form.querySelectorAll('input[type="text"]:not(#nomeTecnico)'));

// Lógica de exibir/ocultar Técnico e aplicar formatação de preenchimento
tipoTermoDropdown.addEventListener('change', () => {
  if (tipoTermoDropdown.value === 'Devolução') {
    nomeTecnicoContainer.style.display = 'block';
    nomeTecnicoInput.required = true;
  } else {
    nomeTecnicoContainer.style.display = 'none';
    nomeTecnicoInput.required = false;
    nomeTecnicoInput.value = ''; 
  }
  validateForm();
});

function validateForm() {
  let requiredCount = baseInputs.length;
  let filled = 0;
  
  baseInputs.forEach(input => {
    if (input.value.trim() !== '') filled++;
  });

  if (tipoTermoDropdown.value === 'Devolução') {
    requiredCount++;
    if (nomeTecnicoInput.value.trim() !== '') filled++;
  }
  
  if (filled === requiredCount) {
    statusAlert.classList.add('ready');
    statusAlert.classList.remove('warning');
    statusText.textContent = "Todos os campos preenchidos! Pronto para gerar.";
  } else {
    statusAlert.classList.remove('ready');
    statusText.textContent = `Preencha todos os campos para gerar. (${filled}/${requiredCount} preenchidos)`;
  }
}

// Add event listeners para tempo real
baseInputs.forEach(input => {
  input.addEventListener('input', validateForm);
});
nomeTecnicoInput.addEventListener('input', validateForm);
validateForm();


// --- Lógica de Geração do Documento ---
async function generateDocx(event) {
  event.preventDefault();
  successMessage.classList.add('hidden');
  
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ GERANDO...';

  const tipo = tipoTermoDropdown.value; 
  const nomeArquivoTemplate = tipo === 'Entrega' ? 'entrega.docx' : 'devolucao.docx';

  const formData = {
    NOME: document.getElementById('nome').value.trim(),
    MATRICULA: document.getElementById('matricula').value.trim(),
    MODELO: document.getElementById('modelo').value.trim(),
    CODIGO_INTERNO: document.getElementById('codigo_interno').value.trim(),
    NUMERO_SERIE: document.getElementById('numero_serie').value.trim(),
    PATRIMONIO: document.getElementById('patrimonio').value.trim(),
    NOME_TECNICO: tipo === 'Devolução' ? nomeTecnicoInput.value.trim() : "",
    DATA: gerarDataPorExtenso()
  };

  try {
    const response = await fetch(`/${nomeArquivoTemplate}`);
    if (!response.ok) {
      throw new Error(`Não foi possível carregar o modelo '${nomeArquivoTemplate}'. Verifique se ele está na pasta public/ do projeto.`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    doc.render(formData);

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Formatar nome de saída
    const termoStr = tipo === 'Entrega' ? 'Termo de Entrega' : 'Termo de Devolução';
    const outputName = `${termoStr} - ${formData.MATRICULA}_${formData.NOME}_${formData.NUMERO_SERIE}.docx`;

    // Fazer download
    saveAs(out, outputName);


    // Sucesso - Limpar Form, atualizar validação
    form.reset();
    
    if (tipoTermoDropdown.value !== 'Devolução') {
      nomeTecnicoContainer.style.display = 'none';
      nomeTecnicoInput.required = false;
    }
    
    validateForm();
    successMessage.classList.remove('hidden');
    setTimeout(() => successMessage.classList.add('hidden'), 5000);

  } catch (error) {
    alert(`ERRO: ${error.message}\nCertifique-se de que o arquivo docx está na pasta /public.`);
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-icon">📄</span> GERAR TERMO E BAIXAR';
  }
}

form.addEventListener('submit', generateDocx);
