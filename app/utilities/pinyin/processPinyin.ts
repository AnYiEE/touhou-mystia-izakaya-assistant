export function processPinyin(pinyin: ReadonlyArray<string>) {
	const {pinyinFirstLetters, pinyinWithoutTone} = pinyin.reduce<{
		pinyinFirstLetters: string;
		pinyinWithoutTone: string[];
	}>(
		(acc, string) => {
			const cleanedString = string.replace(/\d/u, '').toLowerCase();

			if (/\w/u.test(cleanedString)) {
				acc.pinyinFirstLetters += cleanedString.charAt(0);
				acc.pinyinWithoutTone.push(cleanedString);
			}

			return acc;
		},
		{
			pinyinFirstLetters: '',
			pinyinWithoutTone: [],
		}
	);

	return {
		pinyinFirstLetters,
		pinyinWithoutTone,
	};
}
