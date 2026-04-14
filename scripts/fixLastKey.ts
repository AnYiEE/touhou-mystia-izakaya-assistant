import { readFileSync, writeFileSync } from 'fs';

// Fix ja.ts
const fixes: Array<{file: string; key: string; value: string}> = [
	{ file: 'app/data/i18n/ja.ts', key: '"灵符「梦想封印」', value: '"霊符「夢想封印」' },
	{ file: 'app/data/i18n/ko.ts', key: '"灵符「梦想封印」', value: '"영부「몽상봉인」' },
];

for (const { file, key, value } of fixes) {
	let c = readFileSync(file, 'utf8');
	// Use indexOf to find the key with surrounding single quotes
	const searchStr = `'${key}': '',`;
	const idx = c.indexOf(searchStr);
	if (idx >= 0) {
		const safeValue = value.replace(/'/g, "\\'");
		c = c.slice(0, idx) + `'${key}': '${safeValue}',` + c.slice(idx + searchStr.length);
		writeFileSync(file, c, 'utf8');
		console.log(`Fixed "${key}" in ${file}`);
	} else {
		// Debug
		const cidx = c.indexOf('梦想封印');
		if (cidx >= 0) {
			console.log(`Context: ${JSON.stringify(c.slice(cidx - 20, cidx + 30))}`);
		}
		console.log(`Not found: "${key}" in ${file}`);
	}
}
