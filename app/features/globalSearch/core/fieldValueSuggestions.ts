import isNil from 'lodash/isNil.js';
import isObject from 'lodash/isObject.js';

import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { ALL_MAP_LABELS_SET, MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';

import type {
	IGlobalSearchFieldCondition,
	IGlobalSearchIndexField,
	IGlobalSearchIndexItem,
	IGlobalSearchQueryAst,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';

import { createBoundedRuntimeCache } from '@/shared/utilities/cache/createBoundedRuntimeCache';
import { getPinyin } from '@/shared/utilities/pinyin/getPinyin';
import { processPinyin } from '@/shared/utilities/pinyin/processPinyin';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import { checkGlobalSearchSectionMatches } from './constants';
import { getFieldPrefixGroup, getSectionPrefixGroup } from './parser';
import { normalizeSearchMatchText } from './text';

const GLOBAL_SEARCH_VALUE_SUGGESTION_FIELD_TYPES = new Set<
	IGlobalSearchIndexField['fieldType']
>([
	'beverage-tag',
	'category',
	'availability-dlc',
	'content-dlc',
	'cooker-type',
	'guest-tag',
	'ingredient',
	'level',
	'moving-speed',
	'name',
	'negative-tag',
	'place',
	'positive-tag',
	'speed',
	'tag',
	'type',
	'working-speed',
]);

const fieldValuePinyinCache = createBoundedRuntimeCache<
	string,
	{ firstLetters: string; full: string }
>(4096);

function createEmptyStringSet() {
	return new Set<string>();
}

function createGlobalSearchAllowedSectionSet(
	fieldType: IGlobalSearchIndexField['fieldType']
) {
	const fieldGroup = getFieldPrefixGroup(fieldType);
	const allowedSections =
		fieldGroup !== undefined && 'sections' in fieldGroup
			? fieldGroup.sections
			: undefined;

	return allowedSections === undefined
		? null
		: new Set<IGlobalSearchIndexItem['section']>(
				allowedSections as ReadonlyArray<
					IGlobalSearchIndexItem['section']
				>
			);
}

export type TGlobalSearchFieldValueCache = Map<
	IGlobalSearchIndexField['fieldType'],
	string[]
>;

export type TGetGlobalSearchFieldValueOrderMap = (options: {
	contextSection: null | TGlobalSearchSection;
	fieldType: TGlobalSearchFieldType;
}) => Map<string, number> | null;

function getMatchPinyin(value: string) {
	const cachedPinyin = fieldValuePinyinCache.get(value);
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

	fieldValuePinyinCache.set(value, pinyin);
	return pinyin;
}

export function checkGlobalSearchNameMatchesKeyword(
	name: string,
	keyword: string
) {
	const normalizedKeyword = normalizeSearchMatchText(keyword);
	const normalizedName = normalizeSearchMatchText(name);

	if (
		normalizedKeyword.length === 0 ||
		normalizedName.includes(normalizedKeyword)
	) {
		return true;
	}

	const pinyin = getMatchPinyin(name);
	return (
		pinyin.full.includes(normalizedKeyword) ||
		pinyin.firstLetters.includes(normalizedKeyword)
	);
}

function getDlcLabelMeta(value: string) {
	const dlc = Number(value) as TDlc;
	const labelMeta = Number.isFinite(dlc) ? DLC_LABEL_MAP[dlc] : undefined;

	return labelMeta ?? null;
}

export function getGlobalSearchDlcSearchTexts(value: string) {
	const labelMeta = getDlcLabelMeta(value);

	return [value, labelMeta?.label ?? '', labelMeta?.shortLabel ?? ''].filter(
		Boolean
	);
}

export function getGlobalSearchDlcDisplayLabel(value: string) {
	const directLabel = getDlcLabelMeta(value)?.label;
	if (directLabel !== undefined) {
		return directLabel;
	}

	const tokenLabel = value
		.split(/\s+/u)
		.values()
		.map((token) => getDlcLabelMeta(token)?.label)
		.find((label) => label !== undefined);

	return tokenLabel ?? value;
}

export function checkGlobalSearchFieldTypeIsDlc(
	fieldType: IGlobalSearchIndexField['fieldType']
) {
	return fieldType === 'availability-dlc' || fieldType === 'content-dlc';
}

export function getGlobalSearchMatchedDlcDisplayText(
	fieldText: string,
	keyword: string
) {
	const values = fieldText
		.split(/\s+/u)
		.filter((value) => getDlcLabelMeta(value) !== null);
	const matchedValues = values.filter((value) =>
		getGlobalSearchDlcSearchTexts(value).some((text) =>
			checkGlobalSearchNameMatchesKeyword(text, keyword)
		)
	);
	const displayValues = matchedValues.length > 0 ? matchedValues : values;
	const labels = [
		...new Set(displayValues.map(getGlobalSearchDlcDisplayLabel)),
	];

	return labels.length > 0 ? labels.join('、') : fieldText;
}

export function getGlobalSearchFieldValueDisplayText(
	fieldType: IGlobalSearchIndexField['fieldType'],
	value: string
) {
	return checkGlobalSearchFieldTypeIsDlc(fieldType)
		? getGlobalSearchDlcDisplayLabel(value)
		: value;
}

function flattenFieldValue(value: unknown): string[] {
	if (typeof value === 'string' || typeof value === 'number') {
		return value.toString().split(/\s+/u).filter(Boolean);
	}
	if (Array.isArray(value)) {
		return value.flatMap(flattenFieldValue);
	}
	if (isObject(value)) {
		return Object.values(value).flatMap(flattenFieldValue);
	}

	return [];
}

function getFieldValueTokens(
	fieldType: IGlobalSearchIndexField['fieldType'],
	value: unknown,
	text: string
) {
	if (fieldType === 'cooker-type' || fieldType === 'ingredient') {
		return text.split(/\s+/u).filter(Boolean);
	}

	const tokens = flattenFieldValue(value);

	if (checkGlobalSearchFieldTypeIsDlc(fieldType)) {
		return tokens.filter((token) => getDlcLabelMeta(token) !== null);
	}

	if (fieldType === 'place') {
		return tokens.map((token) =>
			ALL_MAP_LABELS_SET.has(token)
				? MAP_FACTS[token as TMapLabel].label
				: token
		);
	}
	if (fieldType === 'speed') {
		return tokens.map((token) => token.split('：').at(-1) ?? token);
	}

	return tokens;
}

function compareFieldValueSuggestion({
	aValue,
	bValue,
	fieldType,
	orderMap,
}: {
	aValue: string;
	bValue: string;
	fieldType: IGlobalSearchIndexField['fieldType'];
	orderMap: Map<string, number> | null;
}) {
	if (orderMap !== null) {
		const aOrder = orderMap.get(aValue);
		const bOrder = orderMap.get(bValue);

		if (aOrder !== undefined && bOrder !== undefined) {
			return numberSort(aOrder, bOrder);
		}
		if (aOrder !== undefined) {
			return -1;
		}
		if (bOrder !== undefined) {
			return 1;
		}
	}

	if (checkGlobalSearchFieldTypeIsDlc(fieldType) || fieldType === 'level') {
		const aNumber = Number(aValue);
		const bNumber = Number(bValue);

		if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
			return numberSort(aNumber, bNumber);
		}
	}

	return pinyinSort(aValue, bValue);
}

function checkFieldValueMatchesKeyword({
	fieldType,
	keyword,
	value,
}: {
	fieldType: IGlobalSearchIndexField['fieldType'];
	keyword: string;
	value: string;
}) {
	if (checkGlobalSearchFieldTypeIsDlc(fieldType)) {
		return getGlobalSearchDlcSearchTexts(value).some((text) =>
			checkGlobalSearchNameMatchesKeyword(text, keyword)
		);
	}

	return checkGlobalSearchNameMatchesKeyword(value, keyword);
}

function checkFieldValueExactlyMatchesKeyword({
	fieldType,
	keyword,
	value,
}: {
	fieldType: IGlobalSearchIndexField['fieldType'];
	keyword: string;
	value: string;
}) {
	const normalizedKeyword = keyword.toLowerCase();
	const texts = checkGlobalSearchFieldTypeIsDlc(fieldType)
		? getGlobalSearchDlcSearchTexts(value)
		: [value];

	return texts.some((text) => text.toLowerCase() === normalizedKeyword);
}

export function createGlobalSearchFieldValueCache({
	contextSection,
	getOrderMap,
	index,
	placeValues,
}: {
	contextSection: null | TGlobalSearchSection;
	getOrderMap: TGetGlobalSearchFieldValueOrderMap;
	index: ReadonlyArray<IGlobalSearchIndexItem>;
	placeValues: ReadonlyArray<string>;
}): TGlobalSearchFieldValueCache {
	const valueMap = new Map<IGlobalSearchIndexField['fieldType'], Set<string>>(
		[['place', new Set(placeValues)]]
	);
	const fieldAllowedSectionMap = new Map<
		IGlobalSearchIndexField['fieldType'],
		null | Set<IGlobalSearchIndexItem['section']>
	>();
	const getAllowedSectionSet = (
		fieldType: IGlobalSearchIndexField['fieldType']
	) =>
		fieldAllowedSectionMap.getOrInsertComputed(
			fieldType,
			createGlobalSearchAllowedSectionSet
		);
	const getValueCacheFieldTypes = (
		fieldType: IGlobalSearchIndexField['fieldType']
	) =>
		fieldType === 'moving-speed' || fieldType === 'working-speed'
			? [fieldType, 'speed' as const]
			: [fieldType];

	index.forEach((item) => {
		if (
			contextSection !== null &&
			!checkGlobalSearchSectionMatches(contextSection, item.section)
		) {
			return;
		}

		item.fields.forEach(({ fieldType, text, value }) => {
			if (!GLOBAL_SEARCH_VALUE_SUGGESTION_FIELD_TYPES.has(fieldType)) {
				return;
			}

			const allowedSectionSet = getAllowedSectionSet(fieldType);
			if (
				contextSection === null &&
				allowedSectionSet !== null &&
				!allowedSectionSet.has(item.section)
			) {
				return;
			}

			getValueCacheFieldTypes(fieldType).forEach((cacheFieldType) => {
				const valueSet = valueMap.getOrInsertComputed(
					cacheFieldType,
					createEmptyStringSet
				);
				getFieldValueTokens(fieldType, value, text).forEach((token) => {
					valueSet.add(token);
				});
			});
		});
	});

	const cache: TGlobalSearchFieldValueCache = new Map();
	valueMap.forEach((values, fieldType) => {
		const orderMap = getOrderMap({ contextSection, fieldType });
		cache.set(
			fieldType,
			[...values].sort((aValue, bValue) =>
				compareFieldValueSuggestion({
					aValue,
					bValue,
					fieldType,
					orderMap,
				})
			)
		);
	});

	return cache;
}

export function getGlobalSearchFieldValueMatches({
	fieldCondition,
	valueCache,
}: {
	fieldCondition: IGlobalSearchFieldCondition | null;
	valueCache: TGlobalSearchFieldValueCache;
}) {
	if (
		fieldCondition === null ||
		!GLOBAL_SEARCH_VALUE_SUGGESTION_FIELD_TYPES.has(
			fieldCondition.fieldType
		)
	) {
		return [];
	}

	const keyword = fieldCondition.keyword.trim();
	const values = valueCache.get(fieldCondition.fieldType) ?? [];
	const normalizedKeyword = keyword.toLowerCase();

	return values
		.filter((value) =>
			keyword.length === 0
				? true
				: checkFieldValueMatchesKeyword({
						fieldType: fieldCondition.fieldType,
						keyword,
						value,
					})
		)
		.sort((aValue, bValue) => {
			const aDisplayValue = getGlobalSearchFieldValueDisplayText(
				fieldCondition.fieldType,
				aValue
			);
			const bDisplayValue = getGlobalSearchFieldValueDisplayText(
				fieldCondition.fieldType,
				bValue
			);
			const aStartsWithKeyword =
				normalizedKeyword.length > 0 &&
				aDisplayValue.toLowerCase().startsWith(normalizedKeyword);
			const bStartsWithKeyword =
				normalizedKeyword.length > 0 &&
				bDisplayValue.toLowerCase().startsWith(normalizedKeyword);

			if (aStartsWithKeyword !== bStartsWithKeyword) {
				return aStartsWithKeyword ? -1 : 1;
			}

			return 0;
		});
}

export function getGlobalSearchFieldValueSuggestions({
	fieldCondition,
	valueCache,
}: {
	fieldCondition: IGlobalSearchFieldCondition | null;
	valueCache: TGlobalSearchFieldValueCache;
}) {
	const matches = getGlobalSearchFieldValueMatches({
		fieldCondition,
		valueCache,
	});
	const keyword = fieldCondition?.keyword.trim() ?? '';

	if (
		keyword.length > 0 &&
		matches.some((value) =>
			checkFieldValueExactlyMatchesKeyword({
				fieldType: fieldCondition?.fieldType ?? 'name',
				keyword,
				value,
			})
		)
	) {
		return [];
	}

	return matches;
}

export function checkGlobalSearchFieldConditionHasExactValue(
	fieldCondition: IGlobalSearchFieldCondition,
	valueCache: TGlobalSearchFieldValueCache
) {
	return getGlobalSearchFieldValueMatches({
		fieldCondition,
		valueCache,
	}).some((fieldValue) =>
		checkFieldValueExactlyMatchesKeyword({
			fieldType: fieldCondition.fieldType,
			keyword: fieldCondition.keyword.trim(),
			value: fieldValue,
		})
	);
}

export function createRelaxedGlobalSearchQuery(ast: IGlobalSearchQueryAst) {
	const sectionGroup =
		ast.resultSection === null
			? null
			: getSectionPrefixGroup(ast.resultSection);
	const tokens = [
		isNil(sectionGroup) ? '' : `@${sectionGroup.aliases[0]}`,
		...ast.freeKeywords,
		...ast.fieldConditions.map(({ keyword }) => keyword).filter(Boolean),
	].filter(Boolean);

	return tokens.join(' ');
}
