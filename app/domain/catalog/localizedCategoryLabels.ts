import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import {
	COOKER_SERIES_LABEL_MAP,
	COOKER_TYPE_LABEL_MAP,
} from '@/domain/data/cookers/cookerFacts';
import type { TCookerSeriesId } from '@/domain/data/cookers/types';
import type { TIngredientTypeId } from '@/domain/data/ingredients/types';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { type TLocalizedMessageTable, translate } from '@/shared/i18n/messages';

const CATEGORY_LABEL_MESSAGES_ZH_CN = {
	'cookerSeries.0': '初始',
	'cookerSeries.1': '夜雀',
	'cookerSeries.2': '超',
	'cookerSeries.3': '极',
	'cookerSeries.4': '核能',
	'cookerSeries.5': '可疑',
	'cookerSeries.6': '月见',
	'cookerSeries.1000': 'DLC',
	'cookerSeries.2000': 'DLC',
	'cookerSeries.3000': 'DLC',
	'cookerSeries.4000': 'DLC',
	'cookerSeries.5000': 'DLC',
	'cookerSeries.5001': 'DLC',
	'ingredientType.-1': '其他',
	'ingredientType.0': '肉类',
	'ingredientType.1': '海鲜',
	'ingredientType.2': '蔬菜',
} as const;

type TCategoryLabelMessageKey = keyof typeof CATEGORY_LABEL_MESSAGES_ZH_CN;

const CATEGORY_LABEL_MESSAGES = {
	en: {
		'cookerSeries.0': 'Base',
		'cookerSeries.1': 'Sparrow',
		'cookerSeries.2': 'Super',
		'cookerSeries.3': 'Extreme',
		'cookerSeries.4': 'Nuclear',
		'cookerSeries.5': 'Suspicious',
		'cookerSeries.6': 'Moon',
		'cookerSeries.1000': 'DLC',
		'cookerSeries.2000': 'DLC',
		'cookerSeries.3000': 'DLC',
		'cookerSeries.4000': 'DLC',
		'cookerSeries.5000': 'DLC',
		'cookerSeries.5001': 'DLC',
		'ingredientType.-1': 'Other',
		'ingredientType.0': 'Meat',
		'ingredientType.1': 'Seafood',
		'ingredientType.2': 'Vegetables',
	},
	ja: {
		'cookerSeries.0': '初期',
		'cookerSeries.1': '夜雀',
		'cookerSeries.2': '超',
		'cookerSeries.3': '極',
		'cookerSeries.4': '核',
		'cookerSeries.5': '怪しい',
		'cookerSeries.6': '月見',
		'cookerSeries.1000': 'DLC',
		'cookerSeries.2000': 'DLC',
		'cookerSeries.3000': 'DLC',
		'cookerSeries.4000': 'DLC',
		'cookerSeries.5000': 'DLC',
		'cookerSeries.5001': 'DLC',
		'ingredientType.-1': 'その他',
		'ingredientType.0': '肉類',
		'ingredientType.1': '魚介類',
		'ingredientType.2': '野菜',
	},
	ko: {
		'cookerSeries.0': '기본',
		'cookerSeries.1': '야작',
		'cookerSeries.2': '슈퍼',
		'cookerSeries.3': '극',
		'cookerSeries.4': '핵',
		'cookerSeries.5': '의심',
		'cookerSeries.6': '월견',
		'cookerSeries.1000': 'DLC',
		'cookerSeries.2000': 'DLC',
		'cookerSeries.3000': 'DLC',
		'cookerSeries.4000': 'DLC',
		'cookerSeries.5000': 'DLC',
		'cookerSeries.5001': 'DLC',
		'ingredientType.-1': '기타',
		'ingredientType.0': '육류',
		'ingredientType.1': '해산물',
		'ingredientType.2': '채소',
	},
	'zh-CN': CATEGORY_LABEL_MESSAGES_ZH_CN,
	'zh-TW': {
		'cookerSeries.0': '初始',
		'cookerSeries.1': '夜雀',
		'cookerSeries.2': '超',
		'cookerSeries.3': '極',
		'cookerSeries.4': '核能',
		'cookerSeries.5': '可疑',
		'cookerSeries.6': '月見',
		'cookerSeries.1000': 'DLC',
		'cookerSeries.2000': 'DLC',
		'cookerSeries.3000': 'DLC',
		'cookerSeries.4000': 'DLC',
		'cookerSeries.5000': 'DLC',
		'cookerSeries.5001': 'DLC',
		'ingredientType.-1': '其他',
		'ingredientType.0': '肉類',
		'ingredientType.1': '海鮮',
		'ingredientType.2': '蔬菜',
	},
} as const satisfies TLocalizedMessageTable<TCategoryLabelMessageKey>;

let activeLocale: TLocale = DEFAULT_LOCALE;

/**
 * @description Category labels (cooker types/series, ingredient types) are a
 * display projection: their numeric ids stay canonical for filters and
 * persistence; only rendered text switches language. Cooker type names reuse
 * the localized cooker records, whose first five entries are the five types.
 */
export function deactivateCategoryLabels() {
	activeLocale = DEFAULT_LOCALE;
}

export function activateCategoryLabels(locale: TLocale) {
	activeLocale = locale;
}

export function getCookerTypeLabel(type: number): string {
	const cookerCatalog = CookerCatalog.getInstance();
	const cooker = cookerCatalog.canonicalData.find(({ availableTypes }) =>
		// eslint-disable-next-line unicorn/prefer-includes -- The record tuple union gives includes() a never parameter.
		availableTypes.some((availableType) => availableType === type)
	);
	const name =
		cooker === undefined
			? null
			: cookerCatalog.getDisplayPropsById(cooker.id, 'name');
	if (name !== null) {
		return name;
	}

	const fallbackLabel = COOKER_TYPE_LABEL_MAP[
		type as keyof typeof COOKER_TYPE_LABEL_MAP
	] as string | undefined;
	return fallbackLabel ?? String(type);
}

export function getCookerSeriesLabel(series: TCookerSeriesId): string {
	const key = `cookerSeries.${series}`;
	if (!(key in CATEGORY_LABEL_MESSAGES_ZH_CN)) {
		return COOKER_SERIES_LABEL_MAP[series];
	}

	return translate(
		CATEGORY_LABEL_MESSAGES,
		activeLocale,
		key as TCategoryLabelMessageKey
	);
}

export function getIngredientTypeLabel(type: TIngredientTypeId): string {
	return translate(
		CATEGORY_LABEL_MESSAGES,
		activeLocale,
		`ingredientType.${type}` as TCategoryLabelMessageKey
	);
}
