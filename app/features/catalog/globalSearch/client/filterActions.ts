'use client';

import { hasEquivalentDlcFilters } from '@/domain/availability';
import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import {
	COOKER_SERIES_LABEL_MAP,
	COOKER_TYPE_LABEL_MAP,
} from '@/domain/data/cookers/cookerFacts';
import { INGREDIENT_TYPE_MAP } from '@/domain/data/ingredients/ingredientFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TDlc } from '@/domain/data/shared/types';
import { BEVERAGE_TAG_MAP, FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';

import { badgesStore } from '@/features/catalog/items/badges/client/state/store';
import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
import { clothesStore } from '@/features/catalog/items/clothes/client/state/store';
import { cookersStore } from '@/features/catalog/items/cookers/client/state/store';
import { currencyItemsStore } from '@/features/catalog/items/currencyItems/client/state/store';
import { decorationsStore } from '@/features/catalog/items/decorations/client/state/store';
import { foodsStore } from '@/features/catalog/items/foods/client/state/store';
import { fishingCollectiblesStore } from '@/features/catalog/items/fishingCollectibles/client/state/store';
import { generalItemsStore } from '@/features/catalog/items/generalItems/client/state/store';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
import { partnersStore } from '@/features/catalog/items/partners/client/state/store';
import { recordsStore } from '@/features/catalog/items/records/client/state/store';
import type {
	IGlobalSearchFilterAction,
	IGlobalSearchQueryAst,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from '@/features/globalSearch/contracts';
import { normalizeSearchMatchText } from '@/features/globalSearch/core/text';

import { createBoundedRuntimeCache } from '@/shared/utilities/cache/createBoundedRuntimeCache';
import { getPinyin } from '@/shared/utilities/pinyin/getPinyin';
import { processPinyin } from '@/shared/utilities/pinyin/processPinyin';

type TFilterableGlobalSearchSection = Extract<
	TGlobalSearchSection,
	| 'badges'
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currency-items'
	| 'decorations'
	| 'foods'
	| 'fishing-collectibles'
	| 'ingredients'
	| 'items'
	| 'partners'
	| 'records'
>;

const GLOBAL_SEARCH_FILTERABLE_SECTIONS = [
	'badges',
	'beverages',
	'clothes',
	'cookers',
	'currency-items',
	'decorations',
	'foods',
	'fishing-collectibles',
	'ingredients',
	'items',
	'partners',
	'records',
] as const satisfies ReadonlyArray<TFilterableGlobalSearchSection>;

function getMappableConditions(ast: IGlobalSearchQueryAst) {
	if (
		ast.diagnostics.length > 0 ||
		ast.freeKeywords.length > 0 ||
		ast.fieldConditions.some(({ keyword }) => keyword.length === 0)
	) {
		return null;
	}

	return ast.fieldConditions.length === 0 ? null : ast.fieldConditions;
}

const FILTER_VALUE_PINYIN_CACHE = createBoundedRuntimeCache<
	string,
	{ firstLetters: string; full: string }
>(2048);

function getMatchPinyin(value: string) {
	const cachedPinyin = FILTER_VALUE_PINYIN_CACHE.get(value);
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

	FILTER_VALUE_PINYIN_CACHE.set(value, pinyin);

	return pinyin;
}

function checkValueMatchesKeyword(value: string, keyword: string) {
	const normalizedKeyword = normalizeSearchMatchText(keyword);
	const normalizedValue = normalizeSearchMatchText(value);
	const pinyin = getMatchPinyin(value);

	return (
		normalizedValue.includes(normalizedKeyword) ||
		pinyin.full.includes(normalizedKeyword) ||
		pinyin.firstLetters.includes(normalizedKeyword)
	);
}

function resolveAvailableValue(
	availableValues: Array<ValueCollection<string | number>>,
	keyword: string
) {
	const normalizedKeyword = normalizeSearchMatchText(keyword);
	const exactMatch = availableValues.find(
		({ value }) =>
			normalizeSearchMatchText(value.toString()) === normalizedKeyword
	);
	if (exactMatch !== undefined) {
		return exactMatch.value.toString();
	}

	return (
		availableValues
			.find(({ value }) =>
				checkValueMatchesKeyword(value.toString(), keyword)
			)
			?.value.toString() ?? null
	);
}

function resolveTypedAvailableValue<TValue extends number | string>(
	availableValues: Array<{ name?: string; value: TValue }>,
	keyword: string,
	getLabel: (option: { name?: string; value: TValue }) => string = (option) =>
		option.name ?? option.value.toString()
) {
	const normalizedKeyword = normalizeSearchMatchText(keyword);
	const exactMatch = availableValues.find(
		(option) =>
			normalizeSearchMatchText(getLabel(option)) === normalizedKeyword
	);
	const match =
		exactMatch ??
		availableValues.find((option) =>
			checkValueMatchesKeyword(getLabel(option), keyword)
		);

	return match === undefined
		? null
		: { label: getLabel(match), value: match.value };
}

function getDlcSearchTexts(value: string | number) {
	const normalizedValue = value.toString();
	const dlc = Number(normalizedValue) as TDlc;
	const labelMeta = Number.isFinite(dlc) ? DLC_LABEL_MAP[dlc] : undefined;

	return [
		normalizedValue,
		labelMeta?.label ?? '',
		labelMeta?.shortLabel ?? '',
	].filter(Boolean);
}

function getDlcDisplayLabel(value: string | number) {
	const dlc = Number(value) as TDlc;

	return dlc in DLC_LABEL_MAP ? DLC_LABEL_MAP[dlc].label : value.toString();
}

function resolveDlcAvailableValue(
	availableValues: Array<ValueCollection<string | number>>,
	keyword: string
) {
	const normalizedKeyword = normalizeSearchMatchText(keyword);
	const exactMatch = availableValues.find(({ value }) =>
		getDlcSearchTexts(value).some(
			(text) => normalizeSearchMatchText(text) === normalizedKeyword
		)
	);
	if (exactMatch !== undefined) {
		return exactMatch.value.toString();
	}

	return (
		availableValues
			.find(({ value }) =>
				getDlcSearchTexts(value).some((text) =>
					checkValueMatchesKeyword(text, keyword)
				)
			)
			?.value.toString() ?? null
	);
}

function appendFilterValue<T extends number | string>(
	currentValues: T[],
	setValues: (values: T[]) => void,
	value: T
) {
	if (currentValues.includes(value)) {
		return;
	}

	setValues([...currentValues, value]);
}

function createAppendFilterAction<T extends number | string>({
	currentValues,
	description,
	setValues,
	value,
}: {
	currentValues: () => T[];
	description: string;
	setValues: (values: T[]) => void;
	value: T;
}): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> {
	return {
		description,
		run: () => {
			appendFilterValue(currentValues(), setValues, value);
		},
	};
}

function createDlcFilterAction({
	availableValues,
	currentValues,
	filterLabel,
	keyword,
	setValues,
}: {
	availableValues: () => Array<ValueCollection<string | number>>;
	currentValues: () => string[];
	filterLabel: '内容归属' | '可获取于';
	keyword: string;
	setValues: (values: string[]) => void;
}): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	const value = resolveDlcAvailableValue(availableValues(), keyword);
	if (value === null) {
		return null;
	}

	return createAppendFilterAction({
		currentValues,
		description: `筛选${filterLabel}：${getDlcDisplayLabel(value)}`,
		setValues,
		value,
	});
}

function getDlcFilterKind(
	fieldType: TGlobalSearchFieldType,
	data: Parameters<typeof hasEquivalentDlcFilters>[0]
) {
	return fieldType === 'availability-dlc'
		? hasEquivalentDlcFilters(data)
			? 'content'
			: 'availability'
		: fieldType === 'content-dlc'
			? 'content'
			: null;
}

function createFoodFilterAction(
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	const dlcFilterKind = getDlcFilterKind(
		fieldType,
		foodsStore.instance.get().data
	);
	if (dlcFilterKind !== null) {
		return createDlcFilterAction({
			availableValues:
				dlcFilterKind === 'availability'
					? foodsStore.availableAvailabilityDlcs.get
					: foodsStore.availableContentDlcs.get,
			currentValues:
				dlcFilterKind === 'availability'
					? foodsStore.persistence.filters.availabilityDlcs.get
					: foodsStore.persistence.filters.contentDlcs.get,
			filterLabel:
				dlcFilterKind === 'availability' ? '可获取于' : '内容归属',
			keyword,
			setValues:
				dlcFilterKind === 'availability'
					? foodsStore.persistence.filters.availabilityDlcs.set
					: foodsStore.persistence.filters.contentDlcs.set,
		});
	}

	if (fieldType === 'ingredient') {
		const availableValues = foodsStore.availableIngredients.get();
		const match = resolveTypedAvailableValue(availableValues, keyword);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: foodsStore.persistence.filters.ingredients.get,
			description: `筛选食材包含：${match.label}`,
			setValues: foodsStore.persistence.filters.ingredients.set,
			value: match.value,
		});
	}

	if (fieldType === 'positive-tag') {
		const availableValues = foodsStore.availablePositiveTags.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => FOOD_TAG_MAP[value]
		);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: foodsStore.persistence.filters.positiveTags.get,
			description: `筛选正特性包含：${match.label}`,
			setValues: foodsStore.persistence.filters.positiveTags.set,
			value: match.value,
		});
	}

	if (fieldType === 'negative-tag') {
		const availableValues = foodsStore.availableNegativeTags.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => FOOD_TAG_MAP[value]
		);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: foodsStore.persistence.filters.negativeTags.get,
			description: `筛选反特性包含：${match.label}`,
			setValues: foodsStore.persistence.filters.negativeTags.set,
			value: match.value,
		});
	}

	if (fieldType === 'tag') {
		const positiveMatch = resolveTypedAvailableValue(
			foodsStore.availablePositiveTags.get(),
			keyword,
			({ value }) => FOOD_TAG_MAP[value]
		);
		const negativeMatch = resolveTypedAvailableValue(
			foodsStore.availableNegativeTags.get(),
			keyword,
			({ value }) => FOOD_TAG_MAP[value as TFoodTagId]
		);

		if (positiveMatch !== null && negativeMatch === null) {
			return createAppendFilterAction({
				currentValues: foodsStore.persistence.filters.positiveTags.get,
				description: `筛选正特性包含：${positiveMatch.label}`,
				setValues: foodsStore.persistence.filters.positiveTags.set,
				value: positiveMatch.value,
			});
		}
		if (negativeMatch !== null && positiveMatch === null) {
			return createAppendFilterAction({
				currentValues: foodsStore.persistence.filters.negativeTags.get,
				description: `筛选反特性包含：${negativeMatch.label}`,
				setValues: foodsStore.persistence.filters.negativeTags.set,
				value: negativeMatch.value,
			});
		}

		return null;
	}

	if (fieldType === 'from' || fieldType === 'place') {
		const availableValues = foodsStore.availableSources.get();
		const match = resolveTypedAvailableValue(availableValues, keyword);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: foodsStore.persistence.filters.places.get,
			description: `筛选地区包含：${match.label}`,
			setValues: foodsStore.persistence.filters.places.set,
			value: match.value,
		});
	}

	if (fieldType === 'cooker-type') {
		const availableValues = foodsStore.availableCookerTypes.get();
		const match = resolveTypedAvailableValue(availableValues, keyword);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: foodsStore.persistence.filters.cookerTypes.get,
			description: `筛选厨具：${match.label}`,
			setValues: foodsStore.persistence.filters.cookerTypes.set,
			value: match.value,
		});
	}

	if (fieldType === 'level') {
		const availableValues = foodsStore.availableLevels.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: foodsStore.persistence.filters.levels.get,
			description: `筛选等级：${value}`,
			setValues: foodsStore.persistence.filters.levels.set,
			value,
		});
	}

	return null;
}

function createBeverageFilterAction(
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	const dlcFilterKind = getDlcFilterKind(
		fieldType,
		beveragesStore.instance.get().data
	);
	if (dlcFilterKind !== null) {
		return createDlcFilterAction({
			availableValues:
				dlcFilterKind === 'availability'
					? beveragesStore.availableAvailabilityDlcs.get
					: beveragesStore.availableContentDlcs.get,
			currentValues:
				dlcFilterKind === 'availability'
					? beveragesStore.persistence.filters.availabilityDlcs.get
					: beveragesStore.persistence.filters.contentDlcs.get,
			filterLabel:
				dlcFilterKind === 'availability' ? '可获取于' : '内容归属',
			keyword,
			setValues:
				dlcFilterKind === 'availability'
					? beveragesStore.persistence.filters.availabilityDlcs.set
					: beveragesStore.persistence.filters.contentDlcs.set,
		});
	}

	if (fieldType === 'beverage-tag' || fieldType === 'tag') {
		const availableValues = beveragesStore.availableTags.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => BEVERAGE_TAG_MAP[value]
		);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: beveragesStore.persistence.filters.tags.get,
			description: `筛选标签包含：${match.label}`,
			setValues: beveragesStore.persistence.filters.tags.set,
			value: match.value,
		});
	}

	if (fieldType === 'from' || fieldType === 'place') {
		const availableValues = beveragesStore.availableMaps.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => MAP_FACTS[value].label
		);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: beveragesStore.persistence.filters.places.get,
			description: `筛选地区包含：${match.label}`,
			setValues: beveragesStore.persistence.filters.places.set,
			value: match.value,
		});
	}

	if (fieldType === 'level') {
		const availableValues = beveragesStore.availableLevels.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: beveragesStore.persistence.filters.levels.get,
			description: `筛选等级：${value}`,
			setValues: beveragesStore.persistence.filters.levels.set,
			value,
		});
	}

	return null;
}

function createIngredientFilterAction(
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	const dlcFilterKind = getDlcFilterKind(
		fieldType,
		ingredientsStore.instance.get().data
	);
	if (dlcFilterKind !== null) {
		return createDlcFilterAction({
			availableValues:
				dlcFilterKind === 'availability'
					? ingredientsStore.availableAvailabilityDlcs.get
					: ingredientsStore.availableContentDlcs.get,
			currentValues:
				dlcFilterKind === 'availability'
					? ingredientsStore.persistence.filters.availabilityDlcs.get
					: ingredientsStore.persistence.filters.contentDlcs.get,
			filterLabel:
				dlcFilterKind === 'availability' ? '可获取于' : '内容归属',
			keyword,
			setValues:
				dlcFilterKind === 'availability'
					? ingredientsStore.persistence.filters.availabilityDlcs.set
					: ingredientsStore.persistence.filters.contentDlcs.set,
		});
	}

	if (fieldType === 'type') {
		const availableTypes = ingredientsStore.availableTypes.get();
		const match = resolveTypedAvailableValue(
			availableTypes,
			keyword,
			({ value }) => INGREDIENT_TYPE_MAP[value]
		);
		if (match === null) {
			return null;
		}
		const type = match.value;
		return {
			description: `筛选类型：${INGREDIENT_TYPE_MAP[type]}`,
			run: () => {
				const currentTypes =
					ingredientsStore.persistence.filters.types.get();
				if (!currentTypes.includes(type)) {
					ingredientsStore.persistence.filters.types.set([
						...currentTypes,
						type,
					]);
				}
			},
		};
	}

	if (fieldType === 'tag') {
		const availableValues = ingredientsStore.availableTags.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => FOOD_TAG_MAP[value]
		);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: ingredientsStore.persistence.filters.tags.get,
			description: `筛选标签包含：${match.label}`,
			setValues: ingredientsStore.persistence.filters.tags.set,
			value: match.value,
		});
	}

	if (fieldType === 'from' || fieldType === 'place') {
		const availableValues = ingredientsStore.availableMaps.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => MAP_FACTS[value].label
		);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: ingredientsStore.persistence.filters.places.get,
			description: `筛选地区包含：${match.label}`,
			setValues: ingredientsStore.persistence.filters.places.set,
			value: match.value,
		});
	}

	if (fieldType === 'level') {
		const availableValues = ingredientsStore.availableLevels.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: ingredientsStore.persistence.filters.levels.get,
			description: `筛选等级：${value}`,
			setValues: ingredientsStore.persistence.filters.levels.set,
			value,
		});
	}

	return null;
}

function createCookerFilterAction(
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	const dlcFilterKind = getDlcFilterKind(
		fieldType,
		cookersStore.instance.get().data
	);
	if (dlcFilterKind !== null) {
		return createDlcFilterAction({
			availableValues:
				dlcFilterKind === 'availability'
					? cookersStore.availableAvailabilityDlcs.get
					: cookersStore.availableContentDlcs.get,
			currentValues:
				dlcFilterKind === 'availability'
					? cookersStore.persistence.filters.availabilityDlcs.get
					: cookersStore.persistence.filters.contentDlcs.get,
			filterLabel:
				dlcFilterKind === 'availability' ? '可获取于' : '内容归属',
			keyword,
			setValues:
				dlcFilterKind === 'availability'
					? cookersStore.persistence.filters.availabilityDlcs.set
					: cookersStore.persistence.filters.contentDlcs.set,
		});
	}

	if (fieldType === 'type') {
		const availableValues = cookersStore.availableTypes.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => COOKER_TYPE_LABEL_MAP[value]
		);
		if (match === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: cookersStore.persistence.filters.types.get,
			description: `筛选类型：${match.label}`,
			setValues: cookersStore.persistence.filters.types.set,
			value: match.value,
		});
	}

	if (fieldType === 'category') {
		const availableValues = cookersStore.availableSeries.get();
		const match = resolveTypedAvailableValue(
			availableValues,
			keyword,
			({ value }) => COOKER_SERIES_LABEL_MAP[value]
		);
		if (match === null) {
			return null;
		}
		const group = availableValues.find(
			({ value }) => value === match.value
		);
		if (group === undefined) {
			return null;
		}
		return {
			description: `筛选系列：${match.label}`,
			run: () => {
				const currentValues =
					cookersStore.persistence.filters.series.get();
				const values = [...currentValues];
				for (const series of group.series) {
					if (!values.includes(series)) {
						values.push(series);
					}
				}
				if (values.length > currentValues.length) {
					cookersStore.persistence.filters.series.set(values);
				}
			},
		};
	}

	return null;
}

function createDlcOnlyFilterAction(
	targetSection: Exclude<
		TFilterableGlobalSearchSection,
		'beverages' | 'cookers' | 'foods' | 'ingredients'
	>,
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	const storeMap = {
		badges: badgesStore,
		clothes: clothesStore,
		'currency-items': currencyItemsStore,
		decorations: decorationsStore,
		'fishing-collectibles': fishingCollectiblesStore,
		items: generalItemsStore,
		partners: partnersStore,
		records: recordsStore,
	} as const;
	const dataMap = {
		badges: badgesStore.instance.get().data,
		clothes: clothesStore.instance.get().data,
		'currency-items': currencyItemsStore.instance.get().data,
		decorations: decorationsStore.instance.get().data,
		'fishing-collectibles': fishingCollectiblesStore.instance.get().data,
		items: generalItemsStore.instance.get().data,
		partners: partnersStore.instance.get().data,
		records: recordsStore.instance.get().data,
	} as const;
	if (
		fieldType === 'from' ||
		(targetSection === 'fishing-collectibles' && fieldType === 'place')
	) {
		const sourceStore =
			targetSection === 'fishing-collectibles'
				? fishingCollectiblesStore
				: targetSection === 'records'
					? recordsStore
					: null;
		if (sourceStore === null) {
			return null;
		}
		const value = resolveAvailableValue(
			sourceStore.availableSources.get(),
			keyword
		);
		return value === null
			? null
			: createAppendFilterAction({
					currentValues: sourceStore.persistence.filters.sources.get,
					description: `筛选${targetSection === 'fishing-collectibles' ? '垂钓地区' : '来源'}：${value}`,
					setValues: sourceStore.persistence.filters.sources.set,
					value,
				});
	}
	const targetStore = storeMap[targetSection];
	const dlcFilterKind = getDlcFilterKind(fieldType, dataMap[targetSection]);
	if (dlcFilterKind === null) {
		return null;
	}

	return createDlcFilterAction({
		availableValues:
			dlcFilterKind === 'availability'
				? targetStore.availableAvailabilityDlcs.get
				: targetStore.availableContentDlcs.get,
		currentValues:
			dlcFilterKind === 'availability'
				? targetStore.persistence.filters.availabilityDlcs.get
				: targetStore.persistence.filters.contentDlcs.get,
		filterLabel: dlcFilterKind === 'availability' ? '可获取于' : '内容归属',
		keyword,
		setValues:
			dlcFilterKind === 'availability'
				? targetStore.persistence.filters.availabilityDlcs.set
				: targetStore.persistence.filters.contentDlcs.set,
	});
}

function checkIsFilterableSection(
	section: null | TGlobalSearchSection
): section is TFilterableGlobalSearchSection {
	return GLOBAL_SEARCH_FILTERABLE_SECTIONS.includes(
		section as TFilterableGlobalSearchSection
	);
}

function getFilterTargetSection(
	ast: IGlobalSearchQueryAst,
	currentSection: null | TGlobalSearchSection
) {
	if (ast.resultSection !== null) {
		return checkIsFilterableSection(ast.resultSection)
			? ast.resultSection
			: null;
	}

	return checkIsFilterableSection(currentSection) ? currentSection : null;
}

function getFilterTargetLabel(section: TFilterableGlobalSearchSection) {
	const labelMap = {
		badges: '徽章',
		beverages: '酒水',
		clothes: '衣服',
		cookers: '厨具',
		'currency-items': '货币',
		decorations: '摆件',
		'fishing-collectibles': '垂钓收藏',
		foods: '料理',
		ingredients: '食材',
		items: '道具',
		partners: '伙伴',
		records: '唱片',
	} as const;

	return labelMap[section];
}

function createFilterAction(
	targetSection: TFilterableGlobalSearchSection,
	fieldType: TGlobalSearchFieldType,
	keyword: string
) {
	return targetSection === 'foods'
		? createFoodFilterAction(fieldType, keyword)
		: targetSection === 'beverages'
			? createBeverageFilterAction(fieldType, keyword)
			: targetSection === 'ingredients'
				? createIngredientFilterAction(fieldType, keyword)
				: targetSection === 'cookers'
					? createCookerFilterAction(fieldType, keyword)
					: createDlcOnlyFilterAction(
							targetSection,
							fieldType,
							keyword
						);
}

export function getCatalogSearchFilterAction(
	ast: IGlobalSearchQueryAst,
	currentSection: null | TGlobalSearchSection
): IGlobalSearchFilterAction | null {
	const conditions = getMappableConditions(ast);
	const targetSection = getFilterTargetSection(ast, currentSection);

	if (conditions === null || targetSection === null) {
		return null;
	}

	const actions = conditions.map(({ fieldType, keyword }) =>
		createFilterAction(targetSection, fieldType, keyword)
	);

	if (actions.includes(null)) {
		return null;
	}

	const filterActions = actions.filter(
		(
			action
		): action is Omit<
			IGlobalSearchFilterAction,
			'label' | 'targetSection'
		> => action !== null
	);

	return {
		description: filterActions
			.map(({ description }) => description)
			.join('；'),
		label: `应用到${getFilterTargetLabel(targetSection)}筛选`,
		run: () => {
			filterActions.forEach(({ run }) => {
				run();
			});
		},
		targetSection,
	};
}
