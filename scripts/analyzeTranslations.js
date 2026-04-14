import fs from 'fs';

// Extract all description keys to a JSON file for batched translation
const c = fs.readFileSync('app/data/i18n/en.ts', 'utf8');
const lines = c.split('\n');
let inDesc = false;
let descKeys = [];
for (const l of lines) {
  const m = l.match(/\/\/\s*(.+?)\s*\(/);
  if (m) {
    if (m[1] === '描述文本') {
      inDesc = true;
    } else if (inDesc) {
      break;
    }
  }
  if (inDesc && l.trimEnd().endsWith("'',") && l.trim().startsWith("'")) {
    const km = l.trim().match(/^'((?:[^'\\]|\\.)*)'/);
    if (km) descKeys.push(km[1]);
  }
}
console.log(`Total description keys: ${descKeys.length}`);
fs.writeFileSync('scripts/descriptionKeys.json', JSON.stringify(descKeys, null, 2));
console.log('Written to scripts/descriptionKeys.json');
