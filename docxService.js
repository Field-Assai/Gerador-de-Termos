import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

/**
 * Processa um único documento docx, injetando os dados e baixando para o usuário.
 */
async function processSingleDoc(arquivoTemplate, dadosFormulario, sufixoNome, acessoriosSelecionados = []) {
  const response = await fetch(`/${arquivoTemplate}?v=${new Date().getTime()}`);
  if (!response.ok) {
    throw new Error(`Não foi possível carregar o modelo '${arquivoTemplate}'.`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const zip = new PizZip(arrayBuffer);

  // Manipulação bruta do XML para injeção de marcadores nativos do Word
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

/**
 * Orquestrador principal que lida com a geração de um ou múltiplos documentos
 * baseados no tipo de operação (Entrega, Devolução ou Troca).
 */
export async function processTermos(tipo, isTroca, formDataBase, formDataNovaEntrega, acessoriosSelecionados) {
  if (tipo === 'Entrega') {
    await processSingleDoc('entrega.docx', formDataBase, 'Termo de Entrega', acessoriosSelecionados);
  } else {
    // 1. Gera e baixa a devolução principal do equipamento antigo
    await processSingleDoc('devolucao.docx', formDataBase, 'Termo de Devolução');
    
    // 2. Se for troca, gera em seguida a entrega do equipamento novo
    if (isTroca && formDataNovaEntrega) {
      await processSingleDoc('entrega.docx', formDataNovaEntrega, 'Termo de Entrega');
    }
  }
}
