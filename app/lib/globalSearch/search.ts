import {
	createBoundedRuntimeCache,
	getPinyin,
	numberSort,
	pinyinSort,
	processPinyin,
} from '@/utilities';

import {
	GLOBAL_SEARCH_MAX_RESULTS,
	checkGlobalSearchFieldTypeMatches,
	checkGlobalSearchSectionMatches,
} from './constants';
import type {
	IGlobalSearchIndexField,
	IGlobalSearchIndexItem,
	IGlobalSearchMatchedField,
	IGlobalSearchQueryAst,
	IGlobalSearchResult,
	TGlobalSearchSection,
} from './types';

const MATCH_SCORE = {
	contains: 70,
	exact: 120,
	fuzzy: 35,
	pinyin: 55,
	pinyinInitial: 50,
	prefix: 95,
} as const;
const CONTEXT_SECTION_SCORE = 120;
const PINYIN_KEYWORD_PATTERN = /^[a-z]+$/u;
const textPinyinCache = createBoundedRuntimeCache<
	string,
	{ firstLetters: string; full: string }
>(4096);

function normalizeText(value: string) {
	return value.toLowerCase().replaceAll(/\s+/gu, '');
}

function isSubsequence(needle: string, haystack: string) {
	let needleIndex = 0;

	for (const char of haystack) {
		if (char === needle[needleIndex]) {
			needleIndex += 1;
		}
		if (needleIndex === needle.length) {
			return true;
		}
	}

	return false;
}

function getTextPinyin(value: string) {
	const cachedPinyin = textPinyinCache.get(value);
	if (cachedPinyin !== undefined) {
		return cachedPinyin;
	}

	const { pinyinFirstLetters, pinyinWithoutTone } = processPinyin(
		getPinyin(value)
	);

	const pinyin = {
		firstLetters: pinyinFirstLetters,
		full: pinyinWithoutTone.join(''),
	};

	textPinyinCache.set(value, pinyin);

	return pinyin;
}

function getBaseMatchScore(keyword: string, text: string) {
	const normalizedKeyword = normalizeText(keyword);
	const normalizedText = normalizeText(text);

	if (normalizedKeyword.length === 0 || normalizedText.length === 0) {
		return 0;
	}

	if (normalizedText === normalizedKeyword) {
		return MATCH_SCORE.exact;
	}
	if (normalizedText.startsWith(normalizedKeyword)) {
		return MATCH_SCORE.prefix;
	}
	if (normalizedText.includes(normalizedKeyword)) {
		return MATCH_SCORE.contains;
	}

	if (PINYIN_KEYWORD_PATTERN.test(normalizedKeyword)) {
		const pinyin = getTextPinyin(text);
		if (pinyin.full.includes(normalizedKeyword)) {
			return MATCH_SCORE.pinyin;
		}
		if (pinyin.firstLetters.includes(normalizedKeyword)) {
			return MATCH_SCORE.pinyinInitial;
		}
	}
	if (isSubsequence(normalizedKeyword, normalizedText)) {
		return MATCH_SCORE.fuzzy;
	}

	return 0;
}

function createSnippet(keyword: string, text: string) {
	const normalizedKeyword = keyword.trim().toLowerCase();
	const normalizedText = text.toLowerCase();
	const index = normalizedText.indexOf(normalizedKeyword);

	if (index === -1) {
		return text.length > 36 ? `${text.slice(0, 36)}...` : text;
	}

	const start = Math.max(0, index - 12);
	const end = Math.min(text.length, index + normalizedKeyword.length + 18);
	const prefix = start > 0 ? '...' : '';
	const suffix = end < text.length ? '...' : '';

	return `${prefix}${text.slice(start, end)}${suffix}`;
}

function matchFields(
	fields: ReadonlyArray<IGlobalSearchIndexField>,
	keyword: string
): IGlobalSearchMatchedField[] {
	return fields
		.flatMap<IGlobalSearchMatchedField>((field) => {
			const baseScore = getBaseMatchScore(keyword, field.text);
			if (baseScore === 0) {
				return [];
			}

			return [
				{
					field,
					keyword,
					score: baseScore * field.weight,
					snippet: createSnippet(keyword, field.text),
				},
			];
		})
		.sort((a, b) => numberSort(b.score, a.score));
}

function getContextBoost(
	section: TGlobalSearchSection,
	contextSection?: null | TGlobalSearchSection
) {
	return contextSection !== null &&
		contextSection !== undefined &&
		checkGlobalSearchSectionMatches(contextSection, section)
		? CONTEXT_SECTION_SCORE
		: 0;
}

export function searchGlobalIndex({
	ast,
	contextSection,
	index,
	limit = GLOBAL_SEARCH_MAX_RESULTS,
}: {
	ast: IGlobalSearchQueryAst;
	contextSection?: null | TGlobalSearchSection;
	index: ReadonlyArray<IGlobalSearchIndexItem>;
	limit?: number;
}): IGlobalSearchResult[] {
	const hasQuery =
		ast.resultSection !== null ||
		ast.fieldConditions.some(({ keyword }) => keyword.length > 0) ||
		ast.freeKeywords.length > 0;

	if (!hasQuery) {
		return [];
	}

	return index
		.flatMap<IGlobalSearchResult>((item) => {
			if (
				ast.resultSection !== null &&
				!checkGlobalSearchSectionMatches(
					ast.resultSection,
					item.section
				)
			) {
				return [];
			}

			const matches: IGlobalSearchMatchedField[] = [];
			const scoreParts: number[] = [];

			for (const condition of ast.fieldConditions) {
				if (condition.keyword.length === 0) {
					continue;
				}

				const fields = item.fields.filter(({ fieldType }) =>
					checkGlobalSearchFieldTypeMatches(
						condition.fieldType,
						fieldType
					)
				);
				const fieldMatches = matchFields(fields, condition.keyword);
				const [bestMatch] = fieldMatches;
				if (bestMatch === undefined) {
					return [];
				}
				matches.push(...fieldMatches);
				scoreParts.push(bestMatch.score);
			}

			for (const keyword of ast.freeKeywords) {
				const fieldMatches = matchFields(item.fields, keyword);
				const [bestMatch] = fieldMatches;
				if (bestMatch === undefined) {
					return [];
				}
				matches.push(...fieldMatches);
				scoreParts.push(bestMatch.score);
			}

			if (
				matches.length === 0 &&
				ast.resultSection !== null &&
				checkGlobalSearchSectionMatches(ast.resultSection, item.section)
			) {
				const nameField = item.fields.find(
					({ fieldType }) => fieldType === 'name'
				);
				if (nameField !== undefined) {
					const score = nameField.weight * 5;
					matches.push({
						field: nameField,
						keyword: item.name,
						score,
						snippet: item.name,
					});
					scoreParts.push(score);
				}
			}

			const score =
				scoreParts.reduce((sum, matchScore) => sum + matchScore, 0) +
				getContextBoost(item.section, contextSection);

			return [{ item, matches, score }];
		})
		.sort(
			(a, b) =>
				numberSort(b.score, a.score) ||
				pinyinSort(a.item.name, b.item.name)
		)
		.slice(0, limit);
}
