import fs from 'fs';
import PizZip from 'pizzip';

function addAcessoriosTag(filename) {
    const filePath = `./public/${filename}`;
    if (!fs.existsSync(filePath)) {
        console.log(`Arquivo não encontrado: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);
    let xml = zip.file("word/document.xml").asText();

    // Adiciona {ACESSORIOS} logo após a palavra Fonte.
    if (xml.includes('<w:t>Fonte</w:t>') && !xml.includes('{ACESSORIOS}')) {
        xml = xml.replace('<w:t>Fonte</w:t>', '<w:t>Fonte{ACESSORIOS}</w:t>');
        zip.file("word/document.xml", xml);
        const buf = zip.generate({ type: "nodebuffer" });
        fs.writeFileSync(filePath, buf);
        console.log(`✅ Arquivo ${filename} modificado! Tag {ACESSORIOS} adicionada.`);
    } else if (xml.includes('{ACESSORIOS}')) {
        console.log(`⚠️ Arquivo ${filename} já possui a tag {ACESSORIOS}.`);
    } else {
        console.log(`❌ Palavra Fonte não encontrada perfeitamente em ${filename}.`);
    }
}

addAcessoriosTag('entrega.docx');
