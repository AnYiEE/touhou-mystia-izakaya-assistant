import fs from 'fs';

const content = fs.readFileSync('app/data/i18n/en.ts', 'utf8');
const searchStr = "Cannoli";
const idx = content.indexOf(searchStr);
if (idx === -1) {
  console.log("Cannoli key not found");
  process.exit(1);
}
const lineStart = content.lastIndexOf('\n', idx) + 1;
const lineEnd = content.indexOf('\n', idx);
const line = content.slice(lineStart, lineEnd);

// Replace the empty value with the translation
const translation = 'A Western dessert called \u201CCannoli\u201D in the outside world, originating from Palermo, Italy \u2014 also the most popular afternoon tea treat in Makai. The preparation is quite unique: first secure the flour-based pastry shell on a special iron rod or tin foil, deep-fry until golden, fill with cream filling, and finally sprinkle cocoa powder, powdered sugar, and edible gold leaf on top. \u201CThis kind of dessert is a breeze for this great god!\u201D As Shinki\\\'s essential afternoon tea treat, her magic-made cannoli received great reviews from Makai residents \u2014 until one day she had the bright idea of cooking by hand instead of using magic...';

const newLine = line.replace("': '',", `': '${translation}',`);
const newContent = content.slice(0, lineStart) + newLine + content.slice(lineEnd);
fs.writeFileSync('app/data/i18n/en.ts', newContent);
console.log("Fixed Cannoli key");
