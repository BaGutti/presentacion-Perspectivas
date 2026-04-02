import { getDocument } from 'file:///C:/Users/brian/AppData/Roaming/npm/node_modules/pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';
const data = new Uint8Array(readFileSync('LIBRO HISTORIA DE LA PEDAGOGIA-200-265.pdf'));
const pdf = await getDocument({ data, verbosity: 0 }).promise;
console.log('Pages:', pdf.numPages);
let allText = '';
for (let i = 1; i <= Math.min(10, pdf.numPages); i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  const pageText = content.items.map(item => item.str).join(' ');
  allText += '\n--- PAGE ' + i + ' ---\n' + pageText;
}
console.log(allText);
