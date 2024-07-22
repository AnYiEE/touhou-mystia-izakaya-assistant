export function processPinyin(pinyin: string[]) {
	const pinyinWithoutTone = pinyin.map((string) => string.replace(/\d/u, ''));
	const pinyinFirstLetters = pinyinWithoutTone.map((string) => string.charAt(0)).join('');

	return {
		pinyinFirstLetters,
		pinyinWithoutTone,
	};
}
