import { processPinyin } from './pinyin';

export interface ISearchableItem {
	name: string;
	pinyin: string[];
}

export function getSearchResult(
	searchValue: string,
	{ name, pinyin }: ISearchableItem
) {
	const nameToLowerCase = name.toLowerCase();
	const { pinyinFirstLetters, pinyinWithoutTone } = processPinyin(pinyin);
	const searchValueLowerCase = searchValue.toLowerCase();

	return (
		nameToLowerCase.includes(searchValueLowerCase) ||
		// eslint-disable-next-line unicorn/prefer-string-replace-all
		nameToLowerCase.replace(/\s+/gu, '').includes(searchValueLowerCase) ||
		pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
		pinyinFirstLetters.includes(searchValueLowerCase)
	);
}
