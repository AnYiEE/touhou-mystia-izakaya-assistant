export function processPinyin(pinyin: string[]) {
	const pinyinWithoutTone = pinyin
		.map((string) => string.replace(/\d/u, '').toLowerCase())
		.filter((string) => /\w/u.test(string));
	const pinyinFirstLetters = pinyinWithoutTone.map((string) => string.charAt(0)).join('');

	return {
		pinyinFirstLetters,
		pinyinWithoutTone,
	};
}
