import { getDocument } from 'file:///C:/Users/brian/AppData/Roaming/npm/node_modules/pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync } from 'fs';
const data = new Uint8Array(readFileSync('LIBRO HISTORIA DE LA PEDAGOGIA-200-265.pdf'));
const pdf = await getDocument({ data, verbosity: 0 }).promise;
let allText = '';
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  const pageText = content.items.map(item => item.str).join(' ');
  allText += '\n=== PAGE ' + i + ' ===\n' + pageText;
}
writeFileSync('extracted_text.txt', allText, 'utf8');
console.log('Done! Pages:', pdf.numPages, 'Chars:', allText.length);
