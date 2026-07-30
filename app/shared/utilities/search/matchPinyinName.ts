import { processPinyin } from '@/shared/utilities/pinyin/processPinyin';

interface ISearchableItem {
	name: string;
	pinyin: string[];
}

export type TSearchMatcher = (
	searchValue: string,
	item: ISearchableItem
) => boolean;

export const matchPinyinName: TSearchMatcher = (
	searchValue,
	{ name, pinyin }
) => {
	const nameToLowerCase = name.toLowerCase();
	const { pinyinFirstLetters, pinyinWithoutTone } = processPinyin(pinyin);
	const searchValueLowerCase = searchValue.toLowerCase();

	return (
		nameToLowerCase.includes(searchValueLowerCase) ||
		nameToLowerCase.replace(/\s+/gu, '').includes(searchValueLowerCase) ||
		pinyinWithoutTone.join('').includes(searchValueLowerCase) ||
		pinyinFirstLetters.includes(searchValueLowerCase)
	);
};
