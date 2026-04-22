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
const acessoriosContainer = document.getElementById('acessoriosContainer');
const trocaContainer = document.getElementById('trocaContainer');
const checkTroca = document.getElementById('checkTroca');
const novoEquipamentoGrid = document.getElementById('novoEquipamentoGrid');
const baseInputsNovo = Array.from(novoEquipamentoGrid.querySelectorAll('input[type="text"]'));


// Buscar todos os inputs do tipo text, exceto o do técnico
const baseInputs = Array.from(form.querySelectorAll('input[type="text"]:not(#nomeTecnico)'));

// Lógica de exibir/ocultar Técnico e aplicar formatação de preenchimento
tipoTermoDropdown.addEventListener('change', () => {
  if (tipoTermoDropdown.value === 'Devolução') {
    nomeTecnicoContainer.style.display = 'block';
    nomeTecnicoInput.required = true;
    trocaContainer.style.display = 'block'; // Show Troca option on Devolucao
  } else {
    nomeTecnicoContainer.style.display = 'none';
    nomeTecnicoInput.required = false;
    nomeTecnicoInput.value = ''; 
    trocaContainer.style.display = 'none';
    checkTroca.checked = false; // Reset troca
  }
  updateTrocaVisibility();
});

checkTroca.addEventListener('change', updateTrocaVisibility);

function updateTrocaVisibility() {
  if (tipoTermoDropdown.value === 'Devolução' && checkTroca.checked) {
    novoEquipamentoGrid.style.display = 'grid';
    acessoriosContainer.style.display = 'none'; // Keep accessories hidden during exchange
    baseInputsNovo.forEach(input => input.required = true);
  } else {
    novoEquipamentoGrid.style.display = 'none';
    acessoriosContainer.style.display = tipoTermoDropdown.value === 'Entrega' ? 'block' : 'none';
    baseInputsNovo.forEach(input => {
      input.required = false;
      input.value = '';
    });
  }
  validateForm();
}

function validateForm() {
  let requiredCount = baseInputs.length;
  let filled = 0;
  
  baseInputs.forEach(input => {
    if (input.value.trim() !== '') filled++;
  });

  if (tipoTermoDropdown.value === 'Devolução') {
    requiredCount++;
    if (nomeTecnicoInput.value.trim() !== '') filled++;
    
    if (checkTroca.checked) {
      requiredCount += baseInputsNovo.length;
      baseInputsNovo.forEach(input => {
        if (input.value.trim() !== '') filled++;
      });
    }
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
baseInputsNovo.forEach(input => {
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

  const isTroca = tipo === 'Devolução' && checkTroca.checked;

  // Acessórios apenas na entrega padrão (não na troca, conforme pedido)
  let acessoriosSelecionados = [];
  if (tipo === 'Entrega') {
    if (document.getElementById('checkMouse').checked) acessoriosSelecionados.push('Mouse');
    if (document.getElementById('checkHeadset').checked) acessoriosSelecionados.push('Headset');
    if (document.getElementById('checkMochila').checked) acessoriosSelecionados.push('Mochila');
  }

  // Dados comuns/principais
  const formDataBase = {
    NOME: document.getElementById('nome').value.trim(),
    MATRICULA: document.getElementById('matricula').value.trim(),
    MODELO: document.getElementById('modelo').value.trim(),
    CODIGO_INTERNO: document.getElementById('codigo_interno').value.trim(),
    NUMERO_SERIE: document.getElementById('numero_serie').value.trim(),
    PATRIMONIO: document.getElementById('patrimonio').value.trim(),
    NOME_TECNICO: tipo === 'Devolução' ? nomeTecnicoInput.value.trim() : "",
    DATA: gerarDataPorExtenso()
  };

  async function processDoc(arquivoTemplate, dadosFormulario, sufixoNome) {
    const response = await fetch(`/${arquivoTemplate}?v=${new Date().getTime()}`);
    if (!response.ok) {
      throw new Error(`Não foi possível carregar o modelo '${arquivoTemplate}'.`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const zip = new PizZip(arrayBuffer);

    let xml = zip.file("word/document.xml").asText();
    xml = xml.replace('{ACESSORIOS}', '');

    if (arquivoTemplate === 'entrega.docx' && acessoriosSelecionados.length > 0) {
      const bulletTemplate = '<w:p><w:pPr><w:pStyle w:val="Standarduser"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="15"/></w:numPr><w:rPr><w:color w:val="000000"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr><w:r><w:rPr><w:color w:val="000000"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>REPLACE_TEXTO</w:t></w:r></w:p>';
      
      let extraBullets = '';
      acessoriosSelecionados.forEach(acc => {
         extraBullets += bulletTemplate.replace('REPLACE_TEXTO', acc);
      });
      
      const fonteIndex = xml.indexOf('<w:t>Fonte</w:t>');
      if (fonteIndex !== -1) {
          const pEndIndex = xml.indexOf('</w:p>', fonteIndex) + 6;
          xml = xml.slice(0, pEndIndex) + extraBullets + xml.slice(pEndIndex);
      }
    }
    
    zip.file("word/document.xml", xml);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    doc.render(dadosFormulario);

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const outputName = `${sufixoNome} - ${dadosFormulario.MATRICULA}_${dadosFormulario.NOME}.docx`;
    saveAs(out, outputName);
  }

  try {
    if (tipo === 'Entrega') {
      await processDoc('entrega.docx', formDataBase, 'Termo de Entrega');
    } else {
      // Devolução principal
      await processDoc('devolucao.docx', formDataBase, 'Termo de Devolução');
      
      // Se for troca, gerar também o de entrega
      if (isTroca) {
        const formDataNovaEntrega = {
          ...formDataBase,
          MODELO: document.getElementById('modelo_novo').value.trim(),
          CODIGO_INTERNO: document.getElementById('codigo_interno_novo').value.trim(),
          NUMERO_SERIE: document.getElementById('numero_serie_novo').value.trim(),
          PATRIMONIO: document.getElementById('patrimonio_novo').value.trim(),
        };
        await processDoc('entrega.docx', formDataNovaEntrega, 'Termo de Entrega');
      }
    }

    // Sucesso - Limpar Form, atualizar validação
    form.reset();
    updateTrocaVisibility();
    
    validateForm();
    successMessage.classList.remove('hidden');
    setTimeout(() => successMessage.classList.add('hidden'), 5000);

  } catch (error) {
    alert(`ERRO: ${error.message}`);
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-icon">📄</span> GERAR TERMO E BAIXAR';
  }
}

form.addEventListener('submit', generateDocx);
