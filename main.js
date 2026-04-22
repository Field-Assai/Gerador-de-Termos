import { gerarDataPorExtenso } from './utils.js';
import { processTermos } from './docxService.js';

// --- Atualizar Data na UI ---
document.getElementById('currentDateString').textContent = gerarDataPorExtenso();

// --- Elementos Básicos de UI ---
const form = document.getElementById('termForm');
const successMessage = document.getElementById('successMessage');

const tipoTermoDropdown = document.getElementById('tipoTermo');
const nomeTecnicoContainer = document.getElementById('nomeTecnicoContainer');
const nomeTecnicoInput = document.getElementById('nomeTecnico');
const acessoriosContainer = document.getElementById('acessoriosContainer');
const trocaContainer = document.getElementById('trocaContainer');
const checkTroca = document.getElementById('checkTroca');
const novoEquipamentoGrid = document.getElementById('novoEquipamentoGrid');
const baseInputsNovo = Array.from(novoEquipamentoGrid.querySelectorAll('input[type="text"]'));

// Lógica de exibir/ocultar Técnico e aplicar formatação de preenchimento
tipoTermoDropdown.addEventListener('change', () => {
  if (tipoTermoDropdown.value === 'Devolução') {
    nomeTecnicoContainer.style.display = 'block';
    nomeTecnicoInput.required = true;
    trocaContainer.style.display = 'block'; // Mostrar checkbox de Troca na Devolucao
  } else {
    nomeTecnicoContainer.style.display = 'none';
    nomeTecnicoInput.required = false;
    nomeTecnicoInput.value = ''; 
    trocaContainer.style.display = 'none';
    checkTroca.checked = false; // Resetar troca
  }
  updateTrocaVisibility();
});

checkTroca.addEventListener('change', updateTrocaVisibility);

function updateTrocaVisibility() {
  if (tipoTermoDropdown.value === 'Devolução' && checkTroca.checked) {
    novoEquipamentoGrid.style.display = 'grid';
    acessoriosContainer.style.display = 'none'; // Ocultar acessórios durante a troca
    baseInputsNovo.forEach(input => input.required = true);
  } else {
    novoEquipamentoGrid.style.display = 'none';
    acessoriosContainer.style.display = tipoTermoDropdown.value === 'Entrega' ? 'block' : 'none';
    baseInputsNovo.forEach(input => {
      input.required = false;
      input.value = '';
    });
  }
}

// Auto-formatação para Maiúsculas
const allTextInputs = document.querySelectorAll('input[type="text"]');
allTextInputs.forEach(input => {
  input.addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });
});

// --- Controlador de Submissão do Formulário ---
async function handleFormSubmit(event) {
  event.preventDefault();
  successMessage.classList.add('hidden');
  
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ GERANDO...';

  const tipo = tipoTermoDropdown.value; 
  const isTroca = tipo === 'Devolução' && checkTroca.checked;

  // Extrair acessórios selecionados na entrega
  let acessoriosSelecionados = [];
  if (tipo === 'Entrega') {
    if (document.getElementById('checkMouse').checked) acessoriosSelecionados.push('Mouse');
    if (document.getElementById('checkHeadset').checked) acessoriosSelecionados.push('Headset');
    if (document.getElementById('checkMochila').checked) acessoriosSelecionados.push('Mochila');
  }

  // Agrupar dados base do formulário
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

  // Agrupar dados extras se for uma troca
  let formDataNovaEntrega = null;
  if (isTroca) {
    formDataNovaEntrega = {
      ...formDataBase,
      MODELO: document.getElementById('modelo_novo').value.trim(),
      CODIGO_INTERNO: document.getElementById('codigo_interno_novo').value.trim(),
      NUMERO_SERIE: document.getElementById('numero_serie_novo').value.trim(),
      PATRIMONIO: document.getElementById('patrimonio_novo').value.trim(),
    };
  }

  try {
    // Delegar a lógica pesada de processamento para o Serviço
    await processTermos(tipo, isTroca, formDataBase, formDataNovaEntrega, acessoriosSelecionados);

    // Sucesso - Limpar Form, atualizar visibilidade
    form.reset();
    updateTrocaVisibility();
    
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

// Acoplar controlador ao formulário
form.addEventListener('submit', handleFormSubmit);
