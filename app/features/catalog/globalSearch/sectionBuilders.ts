import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import { RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import {
	getCookerSeriesLabel,
	getCookerTypeLabel,
	getIngredientTypeLabel,
} from '@/domain/catalog/localizedCategoryLabels';
import { getBondFoods } from '@/domain/catalog/queries/getBondFoods';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { getMapLabel, getMerchantLabel } from '@/domain/places/localizedLabels';

import {
	APP_SHELL_NAV_LABEL_KEYS,
	type TAppShellMessageKey,
	appShellMessages,
} from '@/features/appShell/client/messages';
import {
	type TCatalogItemsMessageKey,
	catalogItemsMessages,
} from '@/features/catalog/items/shared/messages';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { getActiveLocalizationLocale } from '@/features/catalog/shared/client/localization/activeLocalizationLocale';
import {
	compareFoodTagLabels,
	getBeverageTagLabel,
	getFoodTagLabel,
} from '@/features/catalog/shared/client/localization/tagLabels';
import type { TGlobalSearchSection } from '@/features/globalSearch/contracts';

import { type TMessageParams, translate } from '@/shared/i18n/messages';
import { numberSort } from '@/shared/utilities/sort/numberSort';

import {
	CATALOG_SEARCH_FIELD_WEIGHT,
	createDlcFields,
	createField,
	createItem,
} from './itemFactory';
import {
	type TCatalogGlobalSearchMessageKey,
	catalogGlobalSearchMessages,
} from './messages';
import {
	extractPlacesFromSource,
	formatGeneralItemSourceText,
	formatSpellCardList,
} from './valueFormatting';

function tAppShell(key: TAppShellMessageKey, params?: TMessageParams): string {
	return translate(
		appShellMessages,
		getActiveLocalizationLocale(),
		key,
		params
	);
}

function tItems(key: TCatalogItemsMessageKey, params?: TMessageParams): string {
	return translate(
		catalogItemsMessages,
		getActiveLocalizationLocale(),
		key,
		params
	);
}

function tSearch(
	key: TCatalogGlobalSearchMessageKey,
	params?: TMessageParams
): string {
	return translate(
		catalogGlobalSearchMessages,
		getActiveLocalizationLocale(),
		key,
		params
	);
}

function getBeverageTagLabels(tags: ReadonlyArray<TBeverageTagId>) {
	return tags.toSorted(numberSort).map((id) => getBeverageTagLabel(id));
}

function getFoodTagLabels(tags: ReadonlyArray<TFoodTagId>) {
	return tags.toSorted(compareFoodTagLabels).map((id) => getFoodTagLabel(id));
}

function getSpecialGuestBondRewards(
	item: TItemData<SpecialGuestCatalog>[number]
) {
	const specialGuest = item.id;
	const foodCatalog = FoodCatalog.getInstance();
	const decorationCatalog = DecorationCatalog.getInstance();
	const bondRewards: Array<{
		level: number | string;
		name: string;
		type: string;
	}> = [
		...getBondFoods(specialGuest, foodCatalog.data).map(
			({ id, level }) => ({
				level,
				name: foodCatalog.getDisplayPropsById(id, 'name'),
				type: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/foods']),
			})
		),
		...decorationCatalog
			.getBondDecorationsBySpecialGuest(specialGuest)
			.map(({ id, level }) => ({
				level,
				name: decorationCatalog.getDisplayPropsById(id, 'name'),
				type: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/decorations']),
			})),
	];
	const cookerCatalog = CookerCatalog.getInstance();
	const clothesCatalog = ClothesCatalog.getInstance();
	const generalItemCatalog = GeneralItemCatalog.getInstance();
	const partnerCatalog = PartnerCatalog.getInstance();
	const bondCooker = cookerCatalog.getBondCookerBySpecialGuest(specialGuest);
	const bondClothes =
		clothesCatalog.getBondClothesBySpecialGuest(specialGuest);
	const bondGeneralItems =
		generalItemCatalog.getBondGeneralItemsBySpecialGuest(specialGuest);
	const bondPartner =
		partnerCatalog.getBondPartnerBySpecialGuest(specialGuest);

	if (bondCooker !== null) {
		bondRewards.push({
			level: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/partners']),
			name: cookerCatalog.getDisplayPropsById(bondCooker, 'name'),
			type: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/cookers']),
		});
	}
	if (bondClothes !== null) {
		bondRewards.push({
			level: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/partners']),
			name: clothesCatalog.getDisplayPropsById(bondClothes, 'name'),
			type: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/clothes']),
		});
	}
	if (item.collection) {
		bondRewards.push({
			level: 5,
			name: tSearch('search.reward.collectionWithMap', {
				map: getMapLabel(item.maps[0]),
			}),
			type: tItems('items.source.way.collect'),
		});
	}
	if (bondPartner !== null) {
		bondRewards.push({
			level: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/partners']),
			name: partnerCatalog.getDisplayPropsById(bondPartner, 'name'),
			type: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/partners']),
		});
	}
	bondRewards.push(
		...bondGeneralItems.map(({ id, level }) => ({
			level,
			name: generalItemCatalog.getDisplayPropsById(id, 'name'),
			type: tAppShell(APP_SHELL_NAV_LABEL_KEYS['/items']),
		}))
	);

	return bondRewards;
}

function createDistinctFields(
	fieldType: Parameters<typeof createField>[0],
	label: string,
	values: ReadonlyArray<unknown>,
	weight: number
) {
	const fields = new Map<string, ReturnType<typeof createField>[number]>();

	values.forEach((value) => {
		createField(fieldType, label, value, weight).forEach((field) => {
			fields.set(field.text, field);
		});
	});

	return [...fields.values()];
}

export function buildFoodItems(data = FoodCatalog.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'level',
					'等级',
					item.level,
					CATALOG_SEARCH_FIELD_WEIGHT.medium
				),
				...createField(
					'price',
					'价格',
					item.price,
					CATALOG_SEARCH_FIELD_WEIGHT.medium
				),
				...createDistinctFields(
					'ingredient',
					'食材',
					item.recipes.map(({ ingredients }) => ingredients),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createDistinctFields(
					'cooker-type',
					'厨具',
					item.recipes.map(({ cookerType }) => cookerType),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'positive-tag',
					'正特性',
					getFoodTagLabels(item.positiveTags),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'negative-tag',
					'反特性',
					getFoodTagLabels(item.negativeTags),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'tag',
					'标签',
					[
						getFoodTagLabels(item.positiveTags),
						getFoodTagLabels(item.negativeTags),
					],
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					extractPlacesFromSource(item.from, {
						isSelfAvailableEverywhere: true,
					}),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
				...createField(
					'from',
					'来源',
					item.from,
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section: 'foods',
		})
	);
}

export function buildBeverageItems(data = BeverageCatalog.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'level',
					'等级',
					item.level,
					CATALOG_SEARCH_FIELD_WEIGHT.medium
				),
				...createField(
					'price',
					'价格',
					item.price,
					CATALOG_SEARCH_FIELD_WEIGHT.medium
				),
				...createField(
					'tag',
					'标签',
					getBeverageTagLabels(item.tags),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'beverage-tag',
					'酒水标签',
					getBeverageTagLabels(item.tags),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					extractPlacesFromSource(item.from, {
						isSelfAvailableEverywhere: true,
					}),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
				...createField(
					'from',
					'来源',
					item.from,
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section: 'beverages',
		})
	);
}

export function buildIngredientItems(
	data = IngredientCatalog.getInstance().data
) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'level',
					'等级',
					item.level,
					CATALOG_SEARCH_FIELD_WEIGHT.medium
				),
				...createField(
					'price',
					'价格',
					item.price,
					CATALOG_SEARCH_FIELD_WEIGHT.medium
				),
				...createField(
					'type',
					'类型',
					getIngredientTypeLabel(item.type),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'tag',
					'标签',
					getFoodTagLabels(item.tags),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					extractPlacesFromSource(item.from),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
				...createField(
					'from',
					'来源',
					item.from,
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section: 'ingredients',
		})
	);
}

export function buildCookerItems(data = CookerCatalog.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'type',
					'类型',
					item.availableTypes.map((id) => getCookerTypeLabel(id)),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'category',
					'类别',
					getCookerSeriesLabel(item.series),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'effect',
					'效果',
					item.effect,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					extractPlacesFromSource(item.from),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
				...createField(
					'from',
					'来源',
					item.from,
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section: 'cookers',
		})
	);
}

export function buildSimpleItemSection(
	section: Extract<
		TGlobalSearchSection,
		'clothes' | 'currency-items' | 'decorations' | 'partners'
	>,
	data = {
		clothes: ClothesCatalog.getInstance().data,
		'currency-items': CurrencyItemCatalog.getInstance().data,
		decorations: DecorationCatalog.getInstance().data,
		partners: PartnerCatalog.getInstance().data,
	}[section]
) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...('effect' in item
					? createField(
							'effect',
							'效果',
							item.effect,
							CATALOG_SEARCH_FIELD_WEIGHT.primary
						)
					: []),
				...('speed' in item
					? [
							...createField(
								'moving-speed',
								'移动速度',
								item.speed.moving,
								CATALOG_SEARCH_FIELD_WEIGHT.primary
							),
							...createField(
								'working-speed',
								'工作速度',
								item.speed.working,
								CATALOG_SEARCH_FIELD_WEIGHT.primary
							),
						]
					: []),
				...createField(
					'place',
					'地区',
					extractPlacesFromSource(item.from),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
				...createField(
					'from',
					'来源',
					item.from,
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section,
		})
	);
}

export function buildGeneralItemItems(
	data = GeneralItemCatalog.getInstance().data
) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'effect',
					'效果',
					item.effects,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'from',
					'来源',
					item.from
						.map(formatGeneralItemSourceText)
						.join(tItems('items.source.listSeparator')),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section: 'items',
		})
	);
}

export function buildRecordItems(data = RecordItemCatalog.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'track-name',
					'曲名',
					item.trackName,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'original',
					'原曲',
					item.original,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'composer',
					'编曲',
					item.composer,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'from',
					'来源',
					getMerchantLabel(item.buy.merchant),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section: 'records',
		})
	);
}

export function buildFishingCollectibleItems(
	data = FishingCollectibleCatalog.getInstance().data
) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'place',
					'垂钓地区',
					getMapLabel(item.map),
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
			],
			name: item.name,
			recordId: item.id,
			section: 'fishing-collectibles',
		})
	);
}

export function buildBadgeItems(data = BadgeCatalog.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'获取条件',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
			],
			name: item.name,
			recordId: item.id,
			section: 'badges',
		})
	);
}

export function buildGuestItems(
	section: 'normal-guests' | 'special-guests',
	data = section === 'special-guests'
		? SpecialGuestCatalog.getInstance().data
		: NormalGuestCatalog.getInstance().data
) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'place',
					'地区',
					item.maps,
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
				...createField(
					'positive-tag',
					'喜好',
					getFoodTagLabels(item.positiveTags),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'beverage-tag',
					'酒水偏好',
					getBeverageTagLabels(item.beverageTags),
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'guest-tag',
					'标签',
					[
						getFoodTagLabels(item.positiveTags),
						getBeverageTagLabels(item.beverageTags),
						'negativeTags' in item
							? getFoodTagLabels(item.negativeTags)
							: [],
					],
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'chat',
					'对话',
					item.chat,
					CATALOG_SEARCH_FIELD_WEIGHT.text
				),
				...('negativeTags' in item
					? createField(
							'negative-tag',
							'厌恶',
							getFoodTagLabels(item.negativeTags),
							CATALOG_SEARCH_FIELD_WEIGHT.primary
						)
					: []),
				...('spellCards' in item
					? [
							...createField(
								'positive-spell-card',
								'奖励符卡',
								formatSpellCardList(
									'positive' in item.spellCards
										? item.spellCards.positive
										: []
								),
								CATALOG_SEARCH_FIELD_WEIGHT.primary
							),
							...createField(
								'negative-spell-card',
								'惩罚符卡',
								formatSpellCardList(
									'negative' in item.spellCards
										? item.spellCards.negative
										: []
								),
								CATALOG_SEARCH_FIELD_WEIGHT.primary
							),
						]
					: []),
				...('evaluation' in item
					? createField(
							'evaluation',
							'评价对话',
							item.evaluation,
							CATALOG_SEARCH_FIELD_WEIGHT.medium
						)
					: []),
				...('collection' in item
					? createField(
							'reward',
							'羁绊奖励',
							getSpecialGuestBondRewards(item),
							CATALOG_SEARCH_FIELD_WEIGHT.medium
						)
					: []),
				...('price' in item
					? createField(
							'price',
							'预算',
							item.price,
							CATALOG_SEARCH_FIELD_WEIGHT.medium
						)
					: []),
			],
			name: item.name,
			recordId: item.id,
			section,
		})
	);
}
