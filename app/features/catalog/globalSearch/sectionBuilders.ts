import { CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import { Clothes } from '@/domain/catalog/items/Clothes';
import { Cooker } from '@/domain/catalog/items/Cooker';
import { Currency } from '@/domain/catalog/items/Currency';
import { Ornament } from '@/domain/catalog/items/Ornament';
import { Partner } from '@/domain/catalog/items/Partner';
import { getBondRecipes } from '@/domain/catalog/queries/getBondRecipes';

import type { TItemData } from '@/features/catalog/shared/contracts';
import type { TGlobalSearchSection } from '@/features/globalSearch/contracts';

import {
	CATALOG_SEARCH_FIELD_WEIGHT,
	createDlcFields,
	createField,
	createItem,
} from './itemFactory';
import {
	extractPlacesFromSource,
	formatSpellCardList,
} from './valueFormatting';

function getCustomerRareBondRewards(item: TItemData<CustomerRare>[number]) {
	const customerName = item.name as never;
	const bondRewards: Array<{
		level: number | string;
		name: string;
		type: string;
	}> = [
		...getBondRecipes(customerName, Recipe.getInstance().data).map(
			({ level, name }) => ({ level, name, type: '料理' })
		),
		...Ornament.getInstance()
			.getBondOrnaments(customerName)
			.map(({ level, name }) => ({ level, name, type: '摆件' })),
	];
	const bondCooker = Cooker.getInstance().getBondCooker(customerName);
	const bondClothes = Clothes.getInstance().getBondClothes(customerName);
	const bondPartner = Partner.getInstance().getBondPartner(customerName);

	if (bondCooker !== null) {
		bondRewards.push({ level: '伙伴', name: bondCooker, type: '厨具' });
	}
	if (bondClothes !== null) {
		bondRewards.push({ level: '伙伴', name: bondClothes, type: '衣服' });
	}
	if (item.collection) {
		bondRewards.push({
			level: 5,
			name: `采集【${item.places[0]}】`,
			type: '采集',
		});
	}
	if (bondPartner !== null) {
		bondRewards.push({ level: '伙伴', name: bondPartner, type: '伙伴' });
	}

	return bondRewards;
}

export function buildRecipeItems(data = Recipe.getInstance().data) {
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
					'ingredient',
					'食材',
					item.ingredients,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'cooker',
					'厨具',
					item.cooker,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'positive-tag',
					'正特性',
					item.positiveTags,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'negative-tag',
					'反特性',
					item.negativeTags,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'tag',
					'标签',
					[item.positiveTags, item.negativeTags],
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					item.places,
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
			section: 'recipes',
		})
	);
}

export function buildBeverageItems(data = Beverage.getInstance().data) {
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
					item.tags,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'beverage-tag',
					'酒水标签',
					item.tags,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					item.places,
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
			section: 'beverages',
		})
	);
}

export function buildIngredientItems(data = Ingredient.getInstance().data) {
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
					item.type,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'tag',
					'标签',
					item.tags,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					item.places,
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
			section: 'ingredients',
		})
	);
}

export function buildCookerItems(data = Cooker.getInstance().data) {
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
					item.type,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'category',
					'类别',
					item.category,
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
			section: 'cookers',
		})
	);
}

export function buildSimpleItemSection(
	section: Extract<
		TGlobalSearchSection,
		'clothes' | 'currencies' | 'ornaments' | 'partners'
	>,
	data = {
		clothes: Clothes.getInstance().data,
		currencies: Currency.getInstance().data,
		ornaments: Ornament.getInstance().data,
		partners: Partner.getInstance().data,
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
			section,
		})
	);
}

export function buildCustomerItems(
	section: 'customer-normal' | 'customer-rare',
	data = section === 'customer-rare'
		? CustomerRare.getInstance().data
		: CustomerNormal.getInstance().data
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
					item.places,
					CATALOG_SEARCH_FIELD_WEIGHT.context
				),
				...createField(
					'positive-tag',
					'喜好',
					item.positiveTags,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'beverage-tag',
					'酒水偏好',
					item.beverageTags,
					CATALOG_SEARCH_FIELD_WEIGHT.primary
				),
				...createField(
					'customer-tag',
					'标签',
					[
						item.positiveTags,
						item.beverageTags,
						'negativeTags' in item ? item.negativeTags : [],
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
							item.negativeTags,
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
							getCustomerRareBondRewards(item),
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
			section,
		})
	);
}
