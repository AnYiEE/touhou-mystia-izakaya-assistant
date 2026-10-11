import isNil from 'lodash/isNil.js';
import isObject from 'lodash/isObject.js';

import { getDlcLabel } from '@/domain/availability/localizedLabels';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import { ALL_MAP_LABELS_SET } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import { getMapLabel } from '@/domain/places/localizedLabels';

import type {
	IGlobalSearchFieldCondition,
	IGlobalSearchIndexField,
	IGlobalSearchIndexItem,
	IGlobalSearchQueryAst,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { createBoundedRuntimeCache } from '@/shared/utilities/cache/createBoundedRuntimeCache';
import { getPinyin } from '@/shared/utilities/pinyin/getPinyin';
import { processPinyin } from '@/shared/utilities/pinyin/processPinyin';
import {
	compareLocalizedName,
	getHangulInitials,
	normalizeMatchText,
} from '@/shared/utilities/search/localeNameMatch';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import { checkGlobalSearchSectionMatches } from './constants';
import { getFieldPrefixGroup, getSectionPrefixGroup } from './parser';

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
	keyword: string,
	locale: TLocale = DEFAULT_LOCALE
) {
	const normalizedKeyword = normalizeMatchText(keyword, locale);
	const normalizedName = normalizeMatchText(name, locale);

	if (normalizedKeyword.length === 0) {
		return true;
	}
	if (normalizedName.includes(normalizedKeyword)) {
		return true;
	}

	if (locale.startsWith('zh')) {
		const pinyin = getMatchPinyin(name);
		return (
			pinyin.full.includes(normalizedKeyword) ||
			pinyin.firstLetters.includes(normalizedKeyword)
		);
	}
	if (locale === 'ko') {
		const trimmedKeyword = keyword.trim();
		return (
			/^[\u3131-\u314E]+$/u.test(trimmedKeyword) &&
			getHangulInitials(name).includes(trimmedKeyword)
		);
	}

	return false;
}

function getDlcLabelMeta(value: string) {
	const dlc = Number(value) as TDlc;
	const labelMeta = Number.isFinite(dlc) ? DLC_LABEL_MAP[dlc] : undefined;

	return labelMeta ?? null;
}

export function getGlobalSearchDlcSearchTexts(value: string) {
	const labelMeta = getDlcLabelMeta(value);
	const localizedLabel =
		labelMeta === null ? null : getDlcLabel(Number(value) as TDlc);

	return [
		value,
		labelMeta?.label ?? '',
		labelMeta?.shortLabel ?? '',
		localizedLabel ?? '',
	].filter(Boolean);
}

export function getGlobalSearchDlcDisplayLabel(value: string) {
	const directMeta = getDlcLabelMeta(value);
	if (directMeta !== null) {
		return getDlcLabel(Number(value) as TDlc);
	}

	const token = value
		.split(/\s+/u)
		.find((candidate) => getDlcLabelMeta(candidate) !== null);

	return token === undefined ? value : getDlcLabel(Number(token) as TDlc);
}

export function checkGlobalSearchFieldTypeIsDlc(
	fieldType: IGlobalSearchIndexField['fieldType']
) {
	return fieldType === 'availability-dlc' || fieldType === 'content-dlc';
}

export function getGlobalSearchMatchedDlcDisplayText(
	fieldText: string,
	keyword: string,
	locale: TLocale = DEFAULT_LOCALE
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

	return labels.length > 0
		? labels.join(locale.startsWith('zh') ? '、' : ', ')
		: fieldText;
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
	if (
		[
			'cooker-type',
			'ingredient',
			'moving-speed',
			'speed',
			'working-speed',
		].includes(fieldType)
	) {
		return text.split(/\s+/u).filter(Boolean);
	}

	const tokens = flattenFieldValue(value);

	if (checkGlobalSearchFieldTypeIsDlc(fieldType)) {
		return tokens.filter((token) => getDlcLabelMeta(token) !== null);
	}

	if (fieldType === 'place') {
		return tokens.map((token) =>
			ALL_MAP_LABELS_SET.has(token)
				? getMapLabel(token as TMapLabel)
				: token
		);
	}

	return tokens;
}

function compareFieldValueSuggestion({
	aValue,
	bValue,
	fieldType,
	locale,
	orderMap,
}: {
	aValue: string;
	bValue: string;
	fieldType: IGlobalSearchIndexField['fieldType'];
	locale: TLocale;
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

	return locale.startsWith('zh')
		? pinyinSort(aValue, bValue)
		: compareLocalizedName(aValue, bValue, locale);
}

function checkFieldValueMatchesKeyword({
	fieldType,
	keyword,
	locale,
	value,
}: {
	fieldType: IGlobalSearchIndexField['fieldType'];
	keyword: string;
	locale: TLocale;
	value: string;
}) {
	if (checkGlobalSearchFieldTypeIsDlc(fieldType)) {
		return getGlobalSearchDlcSearchTexts(value).some((text) =>
			checkGlobalSearchNameMatchesKeyword(text, keyword, locale)
		);
	}

	return checkGlobalSearchNameMatchesKeyword(value, keyword, locale);
}

function checkFieldValueExactlyMatchesKeyword({
	fieldType,
	keyword,
	locale,
	value,
}: {
	fieldType: IGlobalSearchIndexField['fieldType'];
	keyword: string;
	locale: TLocale;
	value: string;
}) {
	const normalizedKeyword = normalizeMatchText(keyword, locale);
	const texts = checkGlobalSearchFieldTypeIsDlc(fieldType)
		? getGlobalSearchDlcSearchTexts(value)
		: [value];

	return texts.some(
		(text) => normalizeMatchText(text, locale) === normalizedKeyword
	);
}

export function createGlobalSearchFieldValueCache({
	contextSection,
	getOrderMap,
	index,
	locale = DEFAULT_LOCALE,
	placeValues,
}: {
	contextSection: null | TGlobalSearchSection;
	getOrderMap: TGetGlobalSearchFieldValueOrderMap;
	index: ReadonlyArray<IGlobalSearchIndexItem>;
	locale?: TLocale;
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
					locale,
					orderMap,
				})
			)
		);
	});

	return cache;
}

export function getGlobalSearchFieldValueMatches({
	fieldCondition,
	locale = DEFAULT_LOCALE,
	valueCache,
}: {
	fieldCondition: IGlobalSearchFieldCondition | null;
	locale?: TLocale;
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
	const normalizedKeyword = normalizeMatchText(keyword, locale);

	return values
		.filter((value) =>
			keyword.length === 0
				? true
				: checkFieldValueMatchesKeyword({
						fieldType: fieldCondition.fieldType,
						keyword,
						locale,
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
				normalizeMatchText(aDisplayValue, locale).startsWith(
					normalizedKeyword
				);
			const bStartsWithKeyword =
				normalizedKeyword.length > 0 &&
				normalizeMatchText(bDisplayValue, locale).startsWith(
					normalizedKeyword
				);

			if (aStartsWithKeyword !== bStartsWithKeyword) {
				return aStartsWithKeyword ? -1 : 1;
			}

			return 0;
		});
}

export function getGlobalSearchFieldValueSuggestions({
	fieldCondition,
	locale = DEFAULT_LOCALE,
	valueCache,
}: {
	fieldCondition: IGlobalSearchFieldCondition | null;
	locale?: TLocale;
	valueCache: TGlobalSearchFieldValueCache;
}) {
	const matches = getGlobalSearchFieldValueMatches({
		fieldCondition,
		locale,
		valueCache,
	});
	const keyword = fieldCondition?.keyword.trim() ?? '';

	if (
		keyword.length > 0 &&
		matches.some((value) =>
			checkFieldValueExactlyMatchesKeyword({
				fieldType: fieldCondition?.fieldType ?? 'name',
				keyword,
				locale,
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
	valueCache: TGlobalSearchFieldValueCache,
	locale: TLocale = DEFAULT_LOCALE
) {
	return getGlobalSearchFieldValueMatches({
		fieldCondition,
		locale,
		valueCache,
	}).some((fieldValue) =>
		checkFieldValueExactlyMatchesKeyword({
			fieldType: fieldCondition.fieldType,
			keyword: fieldCondition.keyword.trim(),
			locale,
			value: fieldValue,
		})
	);
}

export function createRelaxedGlobalSearchQuery(
	ast: IGlobalSearchQueryAst,
	locale: TLocale = DEFAULT_LOCALE
) {
	const sectionGroup =
		ast.resultSection === null
			? null
			: getSectionPrefixGroup(ast.resultSection, locale);
	const tokens = [
		isNil(sectionGroup) ? '' : `@${sectionGroup.aliases[0]}`,
		...ast.freeKeywords,
		...ast.fieldConditions.map(({ keyword }) => keyword).filter(Boolean),
	].filter(Boolean);

	return tokens.join(' ');
}
