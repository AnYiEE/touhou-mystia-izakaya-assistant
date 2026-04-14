import fs from 'fs';

// Fix keys containing fullwidth quotes that regex can't handle
const fixes: [string, string][] = [
  [
    'Cannoli', // already fixed, skip
    ''
  ],
  [
    '大错特错！她从来都没有',
    'Completely wrong! She never \u201Cendured\u201D those rumors, because she simply didn\\\'t care. So even clarifying became unnecessary. Yuuka\\\'s greatest strength is her heart. I believe it\\\'s not her powerful youkai abilities that let her look down on everyone \u2014 what truly makes her invincible is her pure and clean sense of self.'
  ],
  [
    '好久没有人从',
    'It\\\'s been a while since anyone fell down the \u201Crabbit hole.\u201D'
  ],
  [
    '如果制作的料理不带有',
    'If the dish doesn\\\'t have the \u201Cmeat\u201D tag, reduces cooking time by 50%; otherwise increases by 30%. After a customer eats and rates a dish made with this cookware, any subsequent customer served the same dish from this cookware will always give the same rating.'
  ],
  [
    '如果场上不存在',
    'If \u201CMystic Sealing Formation\u201D doesn\\\'t exist on the field, creates one; if it exists, charges it with 2 energy.{{br}}\u201CMystic Sealing Formation\u201D: Gains 1 energy when any rare customer (other than the succubus) releases a spell card. At 7 energy, consumes all energy to trigger \u201CDream Sign: A Grain in Spacetime.\u201D'
  ],
  [
    '实际上是个很善良很温和的人啊。明明是',
    'Actually a very kind and gentle person. Despite the grand title of \u201CBrain of the Moon\u201D... I don\\\'t feel any arrogance at all, though her noble demeanor in every gesture still turns heads.'
  ],
  [
    '寄宿在铃兰花中的妖精',
    'Fairies dwelling in lily of the valley. They work daily to solve the mystery of \u201Cwho exactly is the Rin-Rin that Miss Medicine talks about.\u201D The reward has risen to ninety-nine of the \u201Croundest stones in history,\u201D but no one has solved it yet.'
  ],
  [
    '对我来说，',
    'For me, \u201Ccreation\u201D is sacred \u2014 infusing a work with soul and watching it come into being from nothing is truly wonderful.'
  ],
  [
    '就算像露易兹小姐这样',
    'Even someone like Miss Louise, who wholeheartedly acts for humans, still can\\\'t gain everyone\\\'s approval. Mutual understanding truly isn\\\'t easy. But even so, Miss Louise has no intention of giving up the work she loves. I hope she can always \u201Cstay true to her passion.\u201D'
  ],
];

let content = fs.readFileSync('app/data/i18n/en.ts', 'utf8');
let count = 0;

for (const [searchFragment, translation] of fixes) {
  if (!translation) continue; // skip empty

  // Find the line containing this fragment that still has empty value
  const searchPattern = searchFragment;
  let idx = 0;
  while (true) {
    idx = content.indexOf(searchPattern, idx);
    if (idx === -1) break;

    const lineStart = content.lastIndexOf('\n', idx) + 1;
    const lineEnd = content.indexOf('\n', idx);
    const line = content.slice(lineStart, lineEnd);

    if (line.endsWith("': '',")) {
      const newLine = line.replace("': '',", `': '${translation}',`);
      content = content.slice(0, lineStart) + newLine + content.slice(lineEnd);
      count++;
      break;
    }
    idx = lineEnd;
  }
}

fs.writeFileSync('app/data/i18n/en.ts', content);
console.log(`Fixed ${count} quote-containing keys`);
