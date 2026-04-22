import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

function testDocx() {
    const content = fs.readFileSync('./public/entrega.docx', 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
    });

    const formData = {
        NOME: "Teste Nome",
        MATRICULA: "123",
        MODELO: "Mod",
        CODIGO_INTERNO: "Cod",
        NUMERO_SERIE: "Ser",
        PATRIMONIO: "Pat",
        DATA: "Hoje"
    };

    doc.render(formData);
    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync('./teste_saida.docx', buf);
    console.log("Arquivo gerado em teste_saida.docx");
}

testDocx();
