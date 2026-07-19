import { CUSTOMER_EVALUATION_MAP, DLC_LABEL_MAP, type TDlc } from '@/data';
import {
	Beverage,
	Clothes,
	Cooker,
	Currency,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Ornament,
	Partner,
	Recipe,
} from '@/utils';
import { extractSourcePlacesFromText } from '@/utils/sourcePlaces';
import type { TItemData } from '@/utils/types';

import {
	GLOBAL_SEARCH_SECTION_PATH_MAP,
	GLOBAL_SEARCH_SECTION_PREFIX_GROUPS,
	getGlobalSearchSectionPath,
} from './constants';
import type {
	IGlobalSearchIndexField,
	IGlobalSearchIndexItem,
	TGlobalSearchFieldType,
	TGlobalSearchIndexSection,
	TGlobalSearchSection,
} from './types';

const FIELD_WEIGHT = {
	context: 1.8,
	low: 1,
	medium: 2,
	name: 5,
	primary: 3,
	text: 1.4,
} as const;

const FOOD_SOURCE_METHOD_KEYS = [
	'buy',
	'collect',
	'fishing',
	'fishingAdvanced',
	'task',
] as const;

type TFoodSourceMethodKey = (typeof FOOD_SOURCE_METHOD_KEYS)[number];

interface IGlobalSearchIndexDataOptions {
	beverages?: TItemData<Beverage>;
	clothes?: TItemData<Clothes>;
	cookers?: TItemData<Cooker>;
	currencies?: TItemData<Currency>;
	customerNormal?: TItemData<CustomerNormal>;
	customerRare?: TItemData<CustomerRare>;
	ingredients?: TItemData<Ingredient>;
	ornaments?: TItemData<Ornament>;
	partners?: TItemData<Partner>;
	recipes?: TItemData<Recipe>;
}

function normalizePrimitive(value: unknown): string[] {
	if (value === false) {
		return [];
	}
	if (value === null || value === undefined) {
		return [];
	}
	if (value === true) {
		return ['是'];
	}
	if (typeof value === 'string' || typeof value === 'number') {
		return [value.toString()];
	}
	return [];
}

function checkIsRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkIsFoodSourceMethodKey(
	value: string
): value is TFoodSourceMethodKey {
	return FOOD_SOURCE_METHOD_KEYS.includes(value as TFoodSourceMethodKey);
}

function flattenValue(value: unknown): string[] {
	const primitive = normalizePrimitive(value);
	if (primitive.length > 0) {
		return primitive;
	}
	if (Array.isArray(value)) {
		return value.flatMap(flattenValue);
	}
	if (checkIsRecord(value)) {
		return Object.values(value).flatMap(flattenValue);
	}

	return [];
}

function joinValue(value: unknown) {
	return flattenValue(value).filter(Boolean).join(' ');
}

function formatSourcePrice(value: unknown): string[] {
	if (checkIsRecord(value) && 'currency' in value && 'amount' in value) {
		const currency = joinValue(value['currency']);
		const amount = joinValue(value['amount']);

		return [`${amount}×${currency}`].filter(Boolean);
	}
	if (typeof value === 'number') {
		return [`¥${value}`];
	}

	return flattenValue(value);
}

function formatBondSource(value: unknown): string[] {
	if (checkIsRecord(value) && ('name' in value || 'level' in value)) {
		const name = 'name' in value ? joinValue(value['name']) : '';
		const level = 'level' in value ? joinValue(value['level']) : '';
		const levelNumber = Number(level);

		return [
			[
				name.length > 0 ? `【${name}】羁绊` : '羁绊',
				Number.isFinite(levelNumber)
					? `Lv.${levelNumber - 1} ➞ Lv.${levelNumber}`
					: level,
			]
				.filter(Boolean)
				.join(' '),
		].filter(Boolean);
	}
	if (typeof value === 'string') {
		return [`【${value}】羁绊`];
	}

	return flattenValue(value);
}

function formatBuySource(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(formatBuySource);
	}
	if (checkIsRecord(value) && ('name' in value || 'price' in value)) {
		const name = 'name' in value ? joinValue(value['name']) : '';
		const price =
			'price' in value ? formatSourcePrice(value['price']).join(' ') : '';

		return [price.length > 0 ? `${name}（${price}）` : name].filter(
			Boolean
		);
	}

	return flattenValue(value);
}

function formatLevelupSource(value: unknown): string[] {
	if (Array.isArray(value)) {
		const [level, place] = value;
		const levelText = joinValue(level);
		const levelNumber = Number(levelText);
		const placeText = joinValue(place);

		return [
			[
				Number.isFinite(levelNumber)
					? `游戏等级 Lv.${levelNumber - 1} ➞ Lv.${levelNumber}`
					: levelText,
				placeText.length > 0 ? `且已解锁地区【${placeText}】` : '',
			]
				.filter(Boolean)
				.join(' '),
		].filter(Boolean);
	}

	return flattenValue(value);
}

function formatSourceProbability(value: unknown, label: string) {
	if (typeof value === 'number') {
		return `${value}%${label}`;
	}
	if (value === true) {
		return label;
	}

	return '';
}

function formatSourceArrayItem(value: unknown, probabilityLabel: string) {
	if (!Array.isArray(value)) {
		return joinValue(value);
	}

	const [name, probability, startTime, endTime] = value;
	const details = [
		formatSourceProbability(probability, probabilityLabel),
		typeof startTime === 'number' && typeof endTime === 'number'
			? `出现时间：${startTime}-${endTime}点`
			: '',
	].filter(Boolean);
	const nameText = joinValue(name);

	return details.length === 0
		? nameText
		: `${nameText}（${details.join('；')}）`;
}

function formatFoodSourceMethod(method: TFoodSourceMethodKey, value: unknown) {
	const methodLabelMap = {
		buy: '购买',
		collect: '采集',
		fishing: '钓鱼',
		fishingAdvanced: '高级钓鱼',
		task: '任务',
	} as const;
	const probabilityLabel = method === 'buy' ? '概率出售' : '概率掉落';
	const values = (Array.isArray(value) ? value : [value])
		.map((item) => formatSourceArrayItem(item, probabilityLabel))
		.filter(Boolean);

	return values.length === 0
		? []
		: [`${methodLabelMap[method]}：${values.join('、')}`];
}

function formatSourceValue(value: unknown): string[] {
	const primitive = normalizePrimitive(value);
	if (primitive.length > 0) {
		return primitive;
	}
	if (Array.isArray(value)) {
		return value.flatMap(formatSourceValue);
	}
	if (!checkIsRecord(value)) {
		return [];
	}

	const result: string[] = [];
	const handledKeys = new Set<string>();

	if (value['self'] === true) {
		result.push('初始拥有');
		handledKeys.add('self');
	}
	if ('bond' in value) {
		const level = Number(joinValue(value['level']));
		result.push(
			...formatBondSource(
				checkIsRecord(value['bond']) || !Number.isFinite(level)
					? value['bond']
					: { level, name: value['bond'] }
			)
		);
		handledKeys.add('bond');
		handledKeys.add('level');
	}
	if ('buy' in value) {
		const buySource = value['buy'];
		result.push(
			...(checkIsRecord(buySource)
				? formatBuySource(buySource)
				: formatFoodSourceMethod('buy', buySource))
		);
		handledKeys.add('buy');
	}
	if ('levelup' in value) {
		result.push(...formatLevelupSource(value['levelup']));
		handledKeys.add('levelup');
	}
	if ('price' in value) {
		result.push(...formatSourcePrice(value['price']));
		handledKeys.add('price');
	}

	for (const key of [
		'collect',
		'description',
		'fishing',
		'fishingAdvanced',
		'place',
		'task',
	]) {
		if (key in value) {
			result.push(
				...(checkIsFoodSourceMethodKey(key)
					? formatFoodSourceMethod(key, value[key])
					: formatSourceValue(value[key]))
			);
			handledKeys.add(key);
		}
	}

	Object.entries(value).forEach(([key, item]) => {
		if (!handledKeys.has(key)) {
			result.push(...formatSourceValue(item));
		}
	});

	return result;
}

function formatEffectValue(value: unknown): string[] {
	if (
		Array.isArray(value) &&
		typeof value[0] === 'string' &&
		typeof value[1] === 'boolean'
	) {
		return [
			value[1] ? `${value[0]}（只有米斯蒂娅使用才有此效果）` : value[0],
		];
	}

	return flattenValue(value);
}

function formatRewardValue(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(formatRewardValue);
	}
	if (!checkIsRecord(value)) {
		return flattenValue(value);
	}

	const level = 'level' in value ? joinValue(value['level']) : '';
	const name = 'name' in value ? joinValue(value['name']) : '';
	const type = 'type' in value ? joinValue(value['type']) : '';

	return [
		[
			level.length > 0 ? `Lv.${level}` : '',
			type.length > 0 ? `${type}：` : '',
			name,
		]
			.filter(Boolean)
			.join(''),
	].filter(Boolean);
}

function formatEvaluationValue(value: unknown): string[] {
	if (!checkIsRecord(value)) {
		return flattenValue(value);
	}

	return Object.entries(value).flatMap(([key, item]) => {
		const text = joinValue(item);
		if (text.length === 0) {
			return [];
		}

		const label =
			key in CUSTOMER_EVALUATION_MAP
				? CUSTOMER_EVALUATION_MAP[
						key as keyof typeof CUSTOMER_EVALUATION_MAP
					]
				: undefined;

		return [label === undefined ? text : `${label}：${text}`];
	});
}

function formatPriceValue(value: unknown): string[] {
	if (
		Array.isArray(value) &&
		value.length === 2 &&
		typeof value[0] === 'number' &&
		typeof value[1] === 'number'
	) {
		return [`${value[0]}-${value[1]}`];
	}

	return flattenValue(value);
}

function formatSpeedValue(value: unknown): string[] {
	return flattenValue(value);
}

function extractPlacesFromSource(value: unknown): string[] {
	const places = new Set<string>();

	flattenValue(value).forEach((text) => {
		extractSourcePlacesFromText(text, {
			includeCollaboration: true,
		}).forEach((place) => {
			places.add(place);
		});
	});

	return [...places];
}

function formatDlcValue(value: unknown): string[] {
	return flattenValue(value).flatMap((dlcValue) => {
		const dlc = Number(dlcValue) as TDlc;

		if (!(dlc in DLC_LABEL_MAP)) {
			return dlcValue;
		}

		const labelMeta = DLC_LABEL_MAP[dlc];

		return [labelMeta.label, labelMeta.shortLabel, dlcValue].filter(
			Boolean
		);
	});
}

function joinFieldValue(fieldType: TGlobalSearchFieldType, value: unknown) {
	const formatters: Partial<
		Record<TGlobalSearchFieldType, (value: unknown) => string[]>
	> = {
		'availability-dlc': formatDlcValue,
		'content-dlc': formatDlcValue,
		effect: formatEffectValue,
		evaluation: formatEvaluationValue,
		from: formatSourceValue,
		price: formatPriceValue,
		reward: formatRewardValue,
		speed: formatSpeedValue,
	};
	const formatter = formatters[fieldType] ?? flattenValue;

	return formatter(value).filter(Boolean).join(' ');
}

function formatSpellCardList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(formatSpellCardList);
	}
	if (typeof value !== 'object' || value === null) {
		return normalizePrimitive(value);
	}

	if ('name' in value || 'description' in value) {
		const name = 'name' in value ? joinValue(value.name) : '';
		const description =
			'description' in value ? joinValue(value.description) : '';
		if (name.length > 0 && description.length > 0) {
			return [`${name}：${description}`];
		}

		return [name, description].filter(Boolean);
	}

	return Object.values(value).flatMap(formatSpellCardList);
}

function getCustomerRareBondRewards(item: TItemData<CustomerRare>[number]) {
	const customerName = item.name as never;
	const bondRewards: Array<{
		level: number | string;
		name: string;
		type: string;
	}> = [
		...Recipe.getInstance()
			.getBondRecipes(customerName)
			.map(({ level, name }) => ({ level, name, type: '料理' })),
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

function createField(
	fieldType: TGlobalSearchFieldType,
	label: string,
	value: unknown,
	weight: number
): IGlobalSearchIndexField[] {
	const text = joinFieldValue(fieldType, value);

	return text.length === 0 ? [] : [{ fieldType, label, text, weight }];
}

function createDlcFields({
	availabilityDlcs,
	dlc,
}: {
	availabilityDlcs: ReadonlyArray<TDlc>;
	dlc: TDlc;
}) {
	return [
		...createField('content-dlc', '内容归属', dlc, FIELD_WEIGHT.medium),
		...createField(
			'availability-dlc',
			'可获取于',
			availabilityDlcs,
			FIELD_WEIGHT.medium
		),
	];
}

function getSectionLabel(section: TGlobalSearchSection) {
	return (
		GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(({ key }) => key === section)
			?.label ?? section
	);
}

function createItem({
	description,
	fields,
	name,
	section,
}: {
	description?: unknown;
	fields: IGlobalSearchIndexField[];
	name: string;
	section: TGlobalSearchIndexSection;
}): IGlobalSearchIndexItem {
	const sectionConfig = GLOBAL_SEARCH_SECTION_PREFIX_GROUPS.find(
		({ key }) => key === section
	);
	const spriteTarget =
		sectionConfig !== undefined && 'spriteTarget' in sectionConfig
			? sectionConfig.spriteTarget
			: undefined;
	const href =
		section === 'customer-normal' || section === 'customer-rare'
			? `${GLOBAL_SEARCH_SECTION_PATH_MAP[section]}/${name}`
			: getGlobalSearchSectionPath(section);

	return {
		description: joinValue(description),
		fields: [
			...createField('name', '名称', name, FIELD_WEIGHT.name),
			...fields,
		],
		href,
		id: `${section}:${name}`,
		name,
		section,
		sectionLabel: getSectionLabel(section),
		...(spriteTarget === undefined ? {} : { spriteTarget }),
		targetName: name,
	};
}

function buildRecipeItems(data = Recipe.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'level',
					'等级',
					item.level,
					FIELD_WEIGHT.medium
				),
				...createField(
					'price',
					'价格',
					item.price,
					FIELD_WEIGHT.medium
				),
				...createField(
					'ingredient',
					'食材',
					item.ingredients,
					FIELD_WEIGHT.primary
				),
				...createField(
					'cooker',
					'厨具',
					item.cooker,
					FIELD_WEIGHT.primary
				),
				...createField(
					'positive-tag',
					'正特性',
					item.positiveTags,
					FIELD_WEIGHT.primary
				),
				...createField(
					'negative-tag',
					'反特性',
					item.negativeTags,
					FIELD_WEIGHT.primary
				),
				...createField(
					'tag',
					'标签',
					[item.positiveTags, item.negativeTags],
					FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					item.places,
					FIELD_WEIGHT.context
				),
				...createField('from', '来源', item.from, FIELD_WEIGHT.context),
			],
			name: item.name,
			section: 'recipes',
		})
	);
}

function buildBeverageItems(data = Beverage.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'level',
					'等级',
					item.level,
					FIELD_WEIGHT.medium
				),
				...createField(
					'price',
					'价格',
					item.price,
					FIELD_WEIGHT.medium
				),
				...createField('tag', '标签', item.tags, FIELD_WEIGHT.primary),
				...createField(
					'beverage-tag',
					'酒水标签',
					item.tags,
					FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					item.places,
					FIELD_WEIGHT.context
				),
				...createField('from', '来源', item.from, FIELD_WEIGHT.context),
			],
			name: item.name,
			section: 'beverages',
		})
	);
}

function buildIngredientItems(data = Ingredient.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'level',
					'等级',
					item.level,
					FIELD_WEIGHT.medium
				),
				...createField(
					'price',
					'价格',
					item.price,
					FIELD_WEIGHT.medium
				),
				...createField('type', '类型', item.type, FIELD_WEIGHT.primary),
				...createField('tag', '标签', item.tags, FIELD_WEIGHT.primary),
				...createField(
					'place',
					'地区',
					item.places,
					FIELD_WEIGHT.context
				),
				...createField('from', '来源', item.from, FIELD_WEIGHT.context),
			],
			name: item.name,
			section: 'ingredients',
		})
	);
}

function buildCookerItems(data = Cooker.getInstance().data) {
	return data.map((item) =>
		createItem({
			description: item.description,
			fields: [
				...createField(
					'description',
					'简介',
					item.description,
					FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField('type', '类型', item.type, FIELD_WEIGHT.primary),
				...createField(
					'category',
					'类别',
					item.category,
					FIELD_WEIGHT.primary
				),
				...createField(
					'effect',
					'效果',
					item.effect,
					FIELD_WEIGHT.primary
				),
				...createField(
					'place',
					'地区',
					extractPlacesFromSource(item.from),
					FIELD_WEIGHT.context
				),
				...createField('from', '来源', item.from, FIELD_WEIGHT.context),
			],
			name: item.name,
			section: 'cookers',
		})
	);
}

function buildSimpleItemSection(
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
					FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...('effect' in item
					? createField(
							'effect',
							'效果',
							item.effect,
							FIELD_WEIGHT.primary
						)
					: []),
				...('speed' in item
					? [
							...createField(
								'moving-speed',
								'移动速度',
								item.speed.moving,
								FIELD_WEIGHT.primary
							),
							...createField(
								'working-speed',
								'工作速度',
								item.speed.working,
								FIELD_WEIGHT.primary
							),
						]
					: []),
				...createField(
					'place',
					'地区',
					extractPlacesFromSource(item.from),
					FIELD_WEIGHT.context
				),
				...createField('from', '来源', item.from, FIELD_WEIGHT.context),
			],
			name: item.name,
			section,
		})
	);
}

function buildCustomerItems(
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
					FIELD_WEIGHT.text
				),
				...createDlcFields(item),
				...createField(
					'place',
					'地区',
					item.places,
					FIELD_WEIGHT.context
				),
				...createField(
					'positive-tag',
					'喜好',
					item.positiveTags,
					FIELD_WEIGHT.primary
				),
				...createField(
					'beverage-tag',
					'酒水偏好',
					item.beverageTags,
					FIELD_WEIGHT.primary
				),
				...createField(
					'customer-tag',
					'标签',
					[
						item.positiveTags,
						item.beverageTags,
						'negativeTags' in item ? item.negativeTags : [],
					],
					FIELD_WEIGHT.primary
				),
				...createField('chat', '对话', item.chat, FIELD_WEIGHT.text),
				...('negativeTags' in item
					? createField(
							'negative-tag',
							'厌恶',
							item.negativeTags,
							FIELD_WEIGHT.primary
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
								FIELD_WEIGHT.primary
							),
							...createField(
								'negative-spell-card',
								'惩罚符卡',
								formatSpellCardList(
									'negative' in item.spellCards
										? item.spellCards.negative
										: []
								),
								FIELD_WEIGHT.primary
							),
						]
					: []),
				...('evaluation' in item
					? createField(
							'evaluation',
							'评价对话',
							item.evaluation,
							FIELD_WEIGHT.medium
						)
					: []),
				...('collection' in item
					? createField(
							'reward',
							'羁绊奖励',
							getCustomerRareBondRewards(item),
							FIELD_WEIGHT.medium
						)
					: []),
				...('price' in item
					? createField(
							'price',
							'预算',
							item.price,
							FIELD_WEIGHT.medium
						)
					: []),
			],
			name: item.name,
			section,
		})
	);
}

export function buildGlobalSearchIndex(
	data: IGlobalSearchIndexDataOptions = {}
): IGlobalSearchIndexItem[] {
	return [
		...buildRecipeItems(data.recipes),
		...buildBeverageItems(data.beverages),
		...buildIngredientItems(data.ingredients),
		...buildCookerItems(data.cookers),
		...buildSimpleItemSection('ornaments', data.ornaments),
		...buildSimpleItemSection('clothes', data.clothes),
		...buildSimpleItemSection('partners', data.partners),
		...buildSimpleItemSection('currencies', data.currencies),
		...buildCustomerItems('customer-rare', data.customerRare),
		...buildCustomerItems('customer-normal', data.customerNormal),
	];
}
