import fs from 'fs';
import PizZip from 'pizzip';

function fixDocx(filename) {
    const filePath = `./public/${filename}`;
    if (!fs.existsSync(filePath)) {
        console.log(`❌ Arquivo ${filename} não encontrado na pasta public.`);
        return;
    }

    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);
    let xml = zip.file("word/document.xml").asText();

    // Substitui as setinhas por chaves
    const regex = /&lt;(NOME|MATRICULA|MODELO|CODIGO_INTERNO|NUMERO_SERIE|PATRIMONIO|DATA|NOME_TECNICO)&gt;/g;
    const oldXml = xml;
    xml = xml.replace(regex, '{$1}');

    if (xml !== oldXml) {
        zip.file("word/document.xml", xml);
        const buf = zip.generate({ type: "nodebuffer" });
        fs.writeFileSync(filePath, buf);
        console.log(`✅ Arquivo ${filename} corrigido com sucesso!`);
    } else {
        console.log(`⚠️ Nenhuma setinha perfeita encontrada no ${filename}. Talvez já esteja corrigido ou o Word separou as tags.`);
    }
}

fixDocx('entrega.docx');
fixDocx('devolucao.docx');
