import { memoize } from '@/utilities/memoize';

export const getTone = memoize(function getTone(pinyin: string) {
	const exec = /\d/u.exec(pinyin);

	return exec === null ? 0 : Number.parseInt(exec[0]);
});

export const removeTone = memoize(function removeTone(pinyin: string) {
	return pinyin.replace(/\d/u, '');
});

export const processPinyin = memoize(function processPinyin(
	pinyin: ReadonlyArray<string>
) {
	const { pinyinFirstLetters, pinyinWithoutTone } = pinyin.reduce<{
		pinyinFirstLetters: string;
		pinyinWithoutTone: string[];
	}>(
		(acc, string) => {
			const cleanedString = removeTone(string);

			acc.pinyinFirstLetters += cleanedString.charAt(0);
			acc.pinyinWithoutTone.push(cleanedString);

			return acc;
		},
		{ pinyinFirstLetters: '', pinyinWithoutTone: [] }
	);

	return { pinyinFirstLetters, pinyinWithoutTone };
}, 'WeakMap');
