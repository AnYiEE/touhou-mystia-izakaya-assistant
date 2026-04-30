import { processPinyin } from '@/utilities';

interface ISearchableItem {
	name: string;
	pinyin: string[];
}

export type TSearchMatcher = (
	searchValue: string,
	item: ISearchableItem
) => boolean;

export const getSearchResult: TSearchMatcher = (
	searchValue: string,
	{ name, pinyin }
) => {
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
};
