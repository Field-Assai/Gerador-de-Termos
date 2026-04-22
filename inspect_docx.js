import fs from 'fs';
import PizZip from 'pizzip';

function inspectDocx(filename) {
    const filePath = `./public/${filename}`;
    if (!fs.existsSync(filePath)) {
        console.log(`Arquivo não encontrado: ${filePath}`);
        return;
    }
    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);
    const xml = zip.file("word/document.xml").asText();
    fs.writeFileSync(`inspect_${filename}.txt`, xml);
    console.log(`Log salvo: inspect_${filename}.txt`);
}

inspectDocx('entrega.docx');
