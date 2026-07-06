'use client';

import {
	beveragesStore,
	clothesStore,
	cookersStore,
	currenciesStore,
	ingredientsStore,
	ornamentsStore,
	partnersStore,
	recipesStore,
} from '@/stores';
import { DLC_LABEL_MAP, type TDlc } from '@/data';
import {
	createBoundedRuntimeCache,
	getPinyin,
	processPinyin,
} from '@/utilities';

import type {
	IGlobalSearchQueryAst,
	TGlobalSearchFieldType,
	TGlobalSearchSection,
} from './types';

type TFilterableGlobalSearchSection = Extract<
	TGlobalSearchSection,
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currencies'
	| 'ingredients'
	| 'ornaments'
	| 'partners'
	| 'recipes'
>;

const GLOBAL_SEARCH_FILTERABLE_SECTIONS = [
	'beverages',
	'clothes',
	'cookers',
	'currencies',
	'ingredients',
	'ornaments',
	'partners',
	'recipes',
] as const satisfies ReadonlyArray<TFilterableGlobalSearchSection>;

interface IGlobalSearchFilterAction {
	description: string;
	label: string;
	run: () => void;
	targetSection: TFilterableGlobalSearchSection;
}

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

function normalizeMatchText(value: string) {
	return value.toLowerCase().replaceAll(/\s+/gu, '');
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
	const normalizedKeyword = normalizeMatchText(keyword);
	const normalizedValue = normalizeMatchText(value);
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
	const normalizedKeyword = normalizeMatchText(keyword);
	const exactMatch = availableValues.find(
		({ value }) =>
			normalizeMatchText(value.toString()) === normalizedKeyword
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
	const normalizedKeyword = normalizeMatchText(keyword);
	const exactMatch = availableValues.find(({ value }) =>
		getDlcSearchTexts(value).some(
			(text) => normalizeMatchText(text) === normalizedKeyword
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

function appendFilterValue<T extends string>(
	currentValues: T[],
	setValues: (values: T[]) => void,
	value: string
) {
	if (currentValues.includes(value as T)) {
		return;
	}

	setValues([...currentValues, value as T]);
}

function createAppendFilterAction<T extends string>({
	currentValues,
	description,
	setValues,
	value,
}: {
	currentValues: () => T[];
	description: string;
	setValues: (values: T[]) => void;
	value: string;
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
	keyword,
	setValues,
}: {
	availableValues: () => Array<ValueCollection<string | number>>;
	currentValues: () => string[];
	keyword: string;
	setValues: (values: string[]) => void;
}): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	const value = resolveDlcAvailableValue(availableValues(), keyword);
	if (value === null) {
		return null;
	}

	return createAppendFilterAction({
		currentValues,
		description: `筛选DLC：${getDlcDisplayLabel(value)}`,
		setValues,
		value,
	});
}

function createRecipeFilterAction(
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	if (fieldType === 'dlc') {
		return createDlcFilterAction({
			availableValues: recipesStore.availableDlcs.get,
			currentValues: recipesStore.persistence.filters.dlcs.get,
			keyword,
			setValues: recipesStore.persistence.filters.dlcs.set,
		});
	}

	if (fieldType === 'ingredient') {
		const availableValues = recipesStore.availableIngredients.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: recipesStore.persistence.filters.ingredients.get,
			description: `筛选食材包含：${value}`,
			setValues: recipesStore.persistence.filters.ingredients.set,
			value,
		});
	}

	if (fieldType === 'positive-tag') {
		const availableValues = recipesStore.availablePositiveTags.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: recipesStore.persistence.filters.positiveTags.get,
			description: `筛选正特性包含：${value}`,
			setValues: recipesStore.persistence.filters.positiveTags.set,
			value,
		});
	}

	if (fieldType === 'negative-tag') {
		const availableValues = recipesStore.availableNegativeTags.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: recipesStore.persistence.filters.negativeTags.get,
			description: `筛选反特性包含：${value}`,
			setValues: recipesStore.persistence.filters.negativeTags.set,
			value,
		});
	}

	if (fieldType === 'tag') {
		const positiveValue = resolveAvailableValue(
			recipesStore.availablePositiveTags.get(),
			keyword
		);
		const negativeValue = resolveAvailableValue(
			recipesStore.availableNegativeTags.get(),
			keyword
		);

		if (positiveValue !== null && negativeValue === null) {
			return createAppendFilterAction({
				currentValues:
					recipesStore.persistence.filters.positiveTags.get,
				description: `筛选正特性包含：${positiveValue}`,
				setValues: recipesStore.persistence.filters.positiveTags.set,
				value: positiveValue,
			});
		}
		if (negativeValue !== null && positiveValue === null) {
			return createAppendFilterAction({
				currentValues:
					recipesStore.persistence.filters.negativeTags.get,
				description: `筛选反特性包含：${negativeValue}`,
				setValues: recipesStore.persistence.filters.negativeTags.set,
				value: negativeValue,
			});
		}

		return null;
	}

	if (fieldType === 'from' || fieldType === 'place') {
		const availableValues = recipesStore.availablePlaces.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: recipesStore.persistence.filters.places.get,
			description: `筛选地区包含：${value}`,
			setValues: recipesStore.persistence.filters.places.set,
			value,
		});
	}

	if (fieldType === 'cooker') {
		const availableValues = recipesStore.availableCookers.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: recipesStore.persistence.filters.cookers.get,
			description: `筛选厨具：${value}`,
			setValues: recipesStore.persistence.filters.cookers.set,
			value,
		});
	}

	if (fieldType === 'level') {
		const availableValues = recipesStore.availableLevels.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return createAppendFilterAction({
			currentValues: recipesStore.persistence.filters.levels.get,
			description: `筛选等级：${value}`,
			setValues: recipesStore.persistence.filters.levels.set,
			value,
		});
	}

	return null;
}

function createBeverageFilterAction(
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	if (fieldType === 'dlc') {
		return createDlcFilterAction({
			availableValues: beveragesStore.availableDlcs.get,
			currentValues: beveragesStore.persistence.filters.dlcs.get,
			keyword,
			setValues: beveragesStore.persistence.filters.dlcs.set,
		});
	}

	if (fieldType === 'beverage-tag' || fieldType === 'tag') {
		const availableValues = beveragesStore.availableTags.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return {
			description: `筛选标签包含：${value}`,
			run: () => {
				appendFilterValue(
					beveragesStore.persistence.filters.tags.get(),
					beveragesStore.persistence.filters.tags.set,
					value
				);
			},
		};
	}

	if (fieldType === 'from' || fieldType === 'place') {
		const availableValues = beveragesStore.availablePlaces.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return {
			description: `筛选地区包含：${value}`,
			run: () => {
				appendFilterValue(
					beveragesStore.persistence.filters.places.get(),
					beveragesStore.persistence.filters.places.set,
					value
				);
			},
		};
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
	if (fieldType === 'dlc') {
		return createDlcFilterAction({
			availableValues: ingredientsStore.availableDlcs.get,
			currentValues: ingredientsStore.persistence.filters.dlcs.get,
			keyword,
			setValues: ingredientsStore.persistence.filters.dlcs.set,
		});
	}

	if (fieldType === 'type') {
		const availableValues = ingredientsStore.availableTypes.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return {
			description: `筛选类型：${value}`,
			run: () => {
				appendFilterValue(
					ingredientsStore.persistence.filters.types.get(),
					ingredientsStore.persistence.filters.types.set,
					value
				);
			},
		};
	}

	if (fieldType === 'tag') {
		const availableValues = ingredientsStore.availableTags.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return {
			description: `筛选标签包含：${value}`,
			run: () => {
				appendFilterValue(
					ingredientsStore.persistence.filters.tags.get(),
					ingredientsStore.persistence.filters.tags.set,
					value
				);
			},
		};
	}

	if (fieldType === 'from' || fieldType === 'place') {
		const availableValues = ingredientsStore.availablePlaces.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return {
			description: `筛选地区包含：${value}`,
			run: () => {
				appendFilterValue(
					ingredientsStore.persistence.filters.places.get(),
					ingredientsStore.persistence.filters.places.set,
					value
				);
			},
		};
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
	if (fieldType === 'dlc') {
		return createDlcFilterAction({
			availableValues: cookersStore.availableDlcs.get,
			currentValues: cookersStore.persistence.filters.dlcs.get,
			keyword,
			setValues: cookersStore.persistence.filters.dlcs.set,
		});
	}

	if (fieldType === 'type') {
		const availableValues = cookersStore.availableTypes.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return {
			description: `筛选类型：${value}`,
			run: () => {
				appendFilterValue(
					cookersStore.persistence.filters.types.get(),
					cookersStore.persistence.filters.types.set,
					value
				);
			},
		};
	}

	if (fieldType === 'category') {
		const availableValues = cookersStore.availableCategories.get();
		const value = resolveAvailableValue(availableValues, keyword);
		if (value === null) {
			return null;
		}
		return {
			description: `筛选类别：${value}`,
			run: () => {
				appendFilterValue(
					cookersStore.persistence.filters.categories.get(),
					cookersStore.persistence.filters.categories.set,
					value
				);
			},
		};
	}

	return null;
}

function createDlcOnlyFilterAction(
	targetSection: Exclude<
		TFilterableGlobalSearchSection,
		'beverages' | 'cookers' | 'ingredients' | 'recipes'
	>,
	fieldType: TGlobalSearchFieldType,
	keyword: string
): Omit<IGlobalSearchFilterAction, 'label' | 'targetSection'> | null {
	if (fieldType !== 'dlc') {
		return null;
	}

	const storeMap = {
		clothes: clothesStore,
		currencies: currenciesStore,
		ornaments: ornamentsStore,
		partners: partnersStore,
	} as const;
	const targetStore = storeMap[targetSection];

	return createDlcFilterAction({
		availableValues: targetStore.availableDlcs.get,
		currentValues: targetStore.persistence.filters.dlcs.get,
		keyword,
		setValues: targetStore.persistence.filters.dlcs.set,
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
		beverages: '酒水',
		clothes: '衣服',
		cookers: '厨具',
		currencies: '货币',
		ingredients: '食材',
		ornaments: '摆件',
		partners: '伙伴',
		recipes: '料理',
	} as const;

	return labelMap[section];
}

function createFilterAction(
	targetSection: TFilterableGlobalSearchSection,
	fieldType: TGlobalSearchFieldType,
	keyword: string
) {
	return targetSection === 'recipes'
		? createRecipeFilterAction(fieldType, keyword)
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

export function getGlobalSearchFilterAction(
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
