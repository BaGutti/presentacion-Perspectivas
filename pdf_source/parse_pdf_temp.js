const { PDFParse } = require('C:/Users/brian/AppData/Roaming/npm/node_modules/pdf-parse');
const fs = require('fs');

async function main() {
  try {
    const pdfPath = 'C:/Users/brian/dev/presentacion/LIBRO HISTORIA DE LA PEDAGOGIA-200-265.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer, verbosity: 0 });
    await parser.load();
    const textResult = await parser.getText();
    
    // Write ALL text to output file
    const allText = textResult.pages.map((p, i) => {
      return `\n${'='.repeat(60)}\nPAGE ${i+1} (PDF page ${p.num || i+1})\n${'='.repeat(60)}\n${p.text || ''}`;
    }).join('\n');
    
    fs.writeFileSync('C:/Users/brian/dev/presentacion/pdf_extracted_text.txt', allText, 'utf8');
    console.log('Total pages:', textResult.pages.length);
    console.log('Total chars:', allText.length);
    console.log('DONE');
  } catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
}
main();
