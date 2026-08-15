import isObject from 'lodash/isObject.js';

import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import { COOKER_LIST } from '@/domain/data/cookers/records';
import { CURRENCY_ITEM_LIST } from '@/domain/data/currencyItems/records';
import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import { DECORATION_LIST } from '@/domain/data/decorations/records';
import { FOOD_LIST } from '@/domain/data/foods/records';
import { NORMAL_GUEST_LIST } from '@/domain/data/guests/normal/records';
import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import { PARTNER_LIST } from '@/domain/data/partners/records';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type {
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';
import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TDlc } from '@/domain/data/shared/types';
import { extractMapsFromCollectionPoint } from '@/domain/places/collectionLocations';

import { attachAvailabilityCollectionPointReference } from './acquisitionSourceMetadata';
import { DLC_LABEL_MAP } from './messages';
import {
	combineAvailabilityPaths,
	createAvailabilityPath,
	normalizeAvailabilityPaths,
} from './path';
import {
	formatMerchantReference,
	resolveFoodTaskAvailabilityPath,
	resolveMapAvailabilityPath,
	resolveMerchantAvailabilityResult,
	resolveSpecialGuestBondAvailabilityResult,
} from './sourceResolvers';
import type {
	IAvailabilityAcquisitionSource,
	IAvailabilityAuditEntry,
	IAvailabilityPath,
	IAvailabilityResult,
	TAvailabilityCategory,
} from './types';

interface IFoodAvailabilityItem {
	dlc: TDlc;
	from: IFoodBase['from'] & { self?: true };
	name: string;
}

let currencyItemAvailabilityResultMap:
	| ReadonlyMap<TCurrencyItemId, IAvailabilityResult>
	| undefined;

function compareStrings(left: string, right: string) {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function createResult(
	availabilityPaths: ReadonlyArray<IAvailabilityPath>,
	diagnostics: ReadonlyArray<string> = []
): IAvailabilityResult {
	return {
		availabilityPaths: normalizeAvailabilityPaths(availabilityPaths),
		diagnostics: [...new Set(diagnostics)].sort(compareStrings),
	};
}

function mergeResults(results: ReadonlyArray<IAvailabilityResult>) {
	return createResult(
		results.flatMap(({ availabilityPaths }) => availabilityPaths),
		results.flatMap(({ diagnostics }) => diagnostics)
	);
}

function createDlcPath(
	dlc: TDlc,
	source: string,
	options: {
		readonly acquisitionSources?: ReadonlyArray<IAvailabilityAcquisitionSource>;
		readonly isFishingPath?: boolean;
	} = {}
) {
	return createAvailabilityPath([dlc], source, options);
}

function getSatisfactionRequirementKeys(path: IAvailabilityPath) {
	return new Set(path.requiredDlcs.filter((dlc) => dlc !== 0).map(String));
}

function getMinimalPrerequisitePaths(paths: ReadonlyArray<IAvailabilityPath>) {
	const normalizedPaths = normalizeAvailabilityPaths(paths);
	const requirementKeySets = normalizedPaths.map(
		getSatisfactionRequirementKeys
	);

	return normalizedPaths.filter((_, candidateIndex) => {
		const candidateKeys = requirementKeySets[candidateIndex];
		if (candidateKeys === undefined) {
			return false;
		}

		return !requirementKeySets.some(
			(otherKeys, otherIndex) =>
				otherIndex !== candidateIndex &&
				otherKeys.size < candidateKeys.size &&
				[...otherKeys].every((key) => candidateKeys.has(key))
		);
	});
}

function createFallbackResult(dlc: TDlc, context: string) {
	const dlcLabel = DLC_LABEL_MAP[dlc].label;
	return createResult(
		[
			createDlcPath(dlc, `归属回退：${dlcLabel}`, {
				acquisitionSources: [
					{
						kind: 'unknown',
						name: context,
						place: null,
						probability: null,
						timeWindow: null,
					},
				],
			}),
		],
		[`${context}无法精确解析，已回退到内容归属${dlcLabel}`]
	);
}

function createOpaqueSourceResult(value: string, contentDlc: TDlc) {
	return createResult([
		createDlcPath(contentDlc, value, {
			acquisitionSources: [
				{
					kind: 'unknown',
					name: value,
					place: null,
					probability: null,
					timeWindow: null,
				},
			],
		}),
	]);
}

function ensureResultHasPath(
	result: IAvailabilityResult,
	fallbackDlc: TDlc,
	context: string
) {
	return result.availabilityPaths.length === 0
		? mergeResults([result, createFallbackResult(fallbackDlc, context)])
		: result;
}

function getSpecialGuest(specialGuestId: TSpecialGuestId) {
	const specialGuest = SPECIAL_GUEST_LIST.find(
		({ id }) => id === specialGuestId
	);
	if (specialGuest === undefined) {
		throw new Error(`找不到稀客“${specialGuestId}”`);
	}
	return specialGuest;
}

function getCurrencyItem(currencyItem: TCurrencyItemId) {
	const currencyItemRecord = CURRENCY_ITEM_LIST.find(
		({ id }) => id === currencyItem
	);
	if (currencyItemRecord === undefined) {
		throw new Error(`找不到货币“${currencyItem}”`);
	}
	return currencyItemRecord;
}

function formatMap(map: TMapLabel) {
	return MAP_FACTS[map].label;
}

export function formatCollectionPointReference(
	collectionPoint: TCollectionPointReference
) {
	if ('map' in collectionPoint) {
		return `【${formatMap(collectionPoint.map)}】${collectionPoint.label}`;
	}
	const excludedMaps = collectionPoint.excludedMaps
		.map((map) => `【${formatMap(map)}】`)
		.join('、');
	return `非${excludedMaps}${collectionPoint.label}`;
}

function projectPrice(price: unknown): unknown {
	if (price === null || typeof price === 'number') {
		return price;
	}
	if (Array.isArray(price)) {
		return price.map(projectPrice);
	}
	if (typeof price !== 'object') {
		return price;
	}
	if (
		'amount' in price &&
		'currencyItem' in price &&
		typeof price.amount === 'number' &&
		typeof price.currencyItem === 'number'
	) {
		const currencyItem = CURRENCY_ITEM_LIST.find(
			({ id }) => id === price.currencyItem
		);
		if (currencyItem === undefined) {
			throw new Error(`找不到货币“${price.currencyItem}”`);
		}
		return { amount: price.amount, currencyItem: currencyItem.name };
	}
	if ('currencyItem' in price) {
		return projectPrice(price.currencyItem);
	}
	if ('money' in price) {
		const { money } = price;
		return isObject(money) &&
			'amount' in money &&
			typeof money.amount === 'number'
			? money.amount
			: null;
	}
	return price;
}

function getCurrencyItemIdsFromPrice(price: unknown) {
	const currencyItems: TCurrencyItemId[] = [];

	const collectCurrencyItems = (value: unknown) => {
		if (Array.isArray(value)) {
			value.forEach(collectCurrencyItems);
			return;
		}
		if (!isObject(value)) {
			return;
		}
		if ('currencyItem' in value && typeof value.currencyItem === 'number') {
			const currencyItem = CURRENCY_ITEM_LIST.find(
				({ id }) => id === value.currencyItem
			);
			if (currencyItem !== undefined) {
				currencyItems.push(currencyItem.id);
			}
		}
		Object.values(value).forEach(collectCurrencyItems);
	};

	collectCurrencyItems(price);

	return currencyItems;
}

function formatPurchaseSource(merchant: TMerchantReference, price: unknown) {
	const values = Array.isArray(price) ? price : [price];
	const priceParts = values.flatMap((value) => {
		const projectedValue = projectPrice(value);
		if (typeof projectedValue === 'number') {
			return [String(projectedValue)];
		}
		if (
			isObject(projectedValue) &&
			'amount' in projectedValue &&
			'currencyItem' in projectedValue &&
			typeof projectedValue.amount === 'number' &&
			typeof projectedValue.currencyItem === 'string'
		) {
			return [`${projectedValue.amount}×${projectedValue.currencyItem}`];
		}
		return [];
	});
	const merchantName = formatMerchantReference(merchant);

	return priceParts.length === 0
		? `购买：${merchantName}`
		: `购买：${merchantName}（${priceParts.join(' + ')}）`;
}

function combineMerchantAndCurrencyItemPaths(
	merchant: TMerchantReference,
	fallbackDlc: TDlc,
	source: string,
	currencyItems: ReadonlyArray<TCurrencyItemId>,
	currencyItemResults: ReadonlyMap<TCurrencyItemId, IAvailabilityResult>
) {
	const merchantResult = resolveMerchantAvailabilityResult(
		merchant,
		fallbackDlc,
		source
	);
	const diagnostics = [...merchantResult.diagnostics];
	let combinedPaths = merchantResult.availabilityPaths.map((path) =>
		createAvailabilityPath(path.requiredDlcs, path.sources[0] ?? source, {
			acquisitionSources: path.acquisitionSources,
			isFishingPath: path.isFishingPath,
		})
	);

	currencyItems.forEach((currencyItem) => {
		const currencyItemResult = currencyItemResults.get(currencyItem);
		if (currencyItemResult === undefined) {
			diagnostics.push(`购买路径引用了未知货币“${currencyItem}”`);
			combinedPaths = [];
			return;
		}

		const prerequisitePaths = getMinimalPrerequisitePaths(
			currencyItemResult.availabilityPaths
		);
		combinedPaths = combinedPaths.flatMap((itemPath) =>
			prerequisitePaths.map((currencyItemPath) =>
				createAvailabilityPath(
					[
						...itemPath.requiredDlcs,
						...currencyItemPath.requiredDlcs,
					],
					source,
					{
						acquisitionSources: itemPath.acquisitionSources,
						isFishingPath:
							itemPath.isFishingPath ||
							currencyItemPath.isFishingPath,
					}
				)
			)
		);
		diagnostics.push(...currencyItemResult.diagnostics);
	});

	return createResult(combinedPaths, diagnostics);
}

function formatCurrencyItemSource(
	source: (typeof CURRENCY_ITEM_LIST)[number]['from'][number]
) {
	if ('mapSideTask' in source) {
		return `地区任务：${formatMap(source.mapSideTask.map)}`;
	}
	if ('mapPrayer' in source) {
		return `地区【${formatMap(source.mapPrayer.map)}】${source.mapPrayer.locationLabel}处祈愿`;
	}
	if ('spellCardReward' in source) {
		return `【${getSpecialGuest(source.spellCardReward.specialGuest).name}】奖励符卡`;
	}
	return formatPurchaseSource(source.buy.merchant, source.buy.price);
}

function projectCurrencyItemSource(
	source: (typeof CURRENCY_ITEM_LIST)[number]['from'][number]
) {
	if ('mapSideTask' in source) {
		return { task: formatMap(source.mapSideTask.map) };
	}
	if ('buy' in source) {
		return {
			buy: {
				name: formatMerchantReference(source.buy.merchant),
				price: projectPrice(source.buy.price),
			},
		};
	}
	return formatCurrencyItemSource(source);
}

function resolveCurrencyItemNonBuySource(
	source: (typeof CURRENCY_ITEM_LIST)[number]['from'][number],
	contentDlc: TDlc
) {
	if ('mapSideTask' in source) {
		const { map } = source.mapSideTask;
		const mapDisplayLabel = formatMap(map);
		return createResult([
			resolveMapAvailabilityPath(map, `地区任务：${mapDisplayLabel}`, [
				{
					kind: 'task',
					name: mapDisplayLabel,
					place: map,
					probability: null,
					timeWindow: null,
				},
			]),
		]);
	}
	if ('buy' in source) {
		return createResult([]);
	}
	return createOpaqueSourceResult(
		formatCurrencyItemSource(source),
		contentDlc
	);
}

function buildCurrencyItemAvailabilityResultMap() {
	const resultMap = new Map<TCurrencyItemId, IAvailabilityResult>();

	CURRENCY_ITEM_LIST.forEach((currencyItem) => {
		resultMap.set(
			currencyItem.id,
			mergeResults(
				currencyItem.from
					.filter((source) => !('buy' in source))
					.map((source) =>
						resolveCurrencyItemNonBuySource(
							source,
							currencyItem.dlc
						)
					)
			)
		);
	});

	let hasChanged = true;
	while (hasChanged) {
		hasChanged = false;

		for (const currencyItem of CURRENCY_ITEM_LIST) {
			const currentResult = resultMap.get(currencyItem.id);
			if (currentResult === undefined) {
				continue;
			}

			const buyResults = currencyItem.from.flatMap((source) => {
				if (!('buy' in source)) {
					return [];
				}
				return [
					combineMerchantAndCurrencyItemPaths(
						source.buy.merchant,
						currencyItem.dlc,
						formatPurchaseSource(
							source.buy.merchant,
							source.buy.price
						),
						getCurrencyItemIdsFromPrice(source.buy.price),
						resultMap
					),
				];
			});
			const nextResult = mergeResults([currentResult, ...buyResults]);

			if (JSON.stringify(nextResult) !== JSON.stringify(currentResult)) {
				resultMap.set(currencyItem.id, nextResult);
				hasChanged = true;
			}
		}
	}

	CURRENCY_ITEM_LIST.forEach((currencyItem) => {
		const result = resultMap.get(currencyItem.id);
		if (result !== undefined) {
			resultMap.set(
				currencyItem.id,
				ensureResultHasPath(
					result,
					currencyItem.dlc,
					`货币“${currencyItem.name}”`
				)
			);
		}
	});

	return resultMap;
}

function getCurrencyItemAvailabilityResultMap() {
	currencyItemAvailabilityResultMap ??=
		buildCurrencyItemAvailabilityResultMap();
	return currencyItemAvailabilityResultMap;
}

export function deriveCurrencyItemAvailabilityResult(
	currencyItem: TCurrencyItemId
) {
	const currencyItemRecord = CURRENCY_ITEM_LIST.find(
		({ id }) => id === currencyItem
	);
	const result = getCurrencyItemAvailabilityResultMap().get(currencyItem);

	if (currencyItemRecord === undefined || result === undefined) {
		return createResult([], [`找不到货币“${currencyItem}”`]);
	}
	return result;
}

function projectFoodFrom(from: IFoodAvailabilityItem['from']) {
	const projectedFrom: Record<string, unknown> = {};

	if (from.buy !== undefined) {
		projectedFrom['buy'] = from.buy.map((entry) => {
			if (Array.isArray(entry)) {
				return [formatMerchantReference(entry[0]), ...entry.slice(1)];
			}
			return formatMerchantReference(entry);
		});
	}
	if (from.collect !== undefined) {
		projectedFrom['collect'] = from.collect.map((entry) => {
			if (Array.isArray(entry)) {
				return [
					formatCollectionPointReference(entry[0]),
					...entry.slice(1),
				];
			}
			return formatCollectionPointReference(entry);
		});
	}
	if (from.fishing !== undefined) {
		projectedFrom['fishing'] = from.fishing.map(formatMap);
	}
	if (from.fishingAdvanced !== undefined) {
		projectedFrom['fishingAdvanced'] = from.fishingAdvanced.map(formatMap);
	}
	if (from.self !== undefined) {
		projectedFrom['self'] = from.self;
	}
	if (from.task !== undefined) {
		projectedFrom['task'] = from.task.map(({ task }) => task);
	}

	return projectedFrom;
}

function resolveFoodAvailabilityResult(item: IFoodAvailabilityItem) {
	const results: IAvailabilityResult[] = [];

	if (item.from.self === true) {
		results.push(
			createResult([
				createDlcPath(0, '初始获得', {
					acquisitionSources: [
						{
							kind: 'self',
							name: '初始获得',
							place: null,
							probability: null,
							timeWindow: null,
						},
					],
				}),
			])
		);
	}

	item.from.buy?.forEach((entry) => {
		const merchant = Array.isArray(entry) ? entry[0] : entry;
		const probability =
			Array.isArray(entry) && typeof entry[1] === 'number'
				? entry[1]
				: 100;
		results.push(
			resolveMerchantAvailabilityResult(
				merchant,
				item.dlc,
				`购买：${formatMerchantReference(merchant)}`,
				probability
			)
		);
	});

	item.from.collect?.forEach((entry) => {
		const collectionPoint = Array.isArray(entry) ? entry[0] : entry;
		const probability =
			Array.isArray(entry) && typeof entry[1] === 'number'
				? entry[1]
				: 100;
		const timeWindow =
			Array.isArray(entry) &&
			typeof entry[2] === 'number' &&
			typeof entry[3] === 'number'
				? ([entry[2], entry[3]] as const)
				: null;
		const maps = extractMapsFromCollectionPoint(collectionPoint);
		const collectionPointName =
			formatCollectionPointReference(collectionPoint);

		results.push(
			createResult(
				maps.map((map) =>
					resolveMapAvailabilityPath(
						map,
						`采集：${collectionPointName}`,
						[
							attachAvailabilityCollectionPointReference(
								{
									kind: 'collect',
									name: collectionPointName,
									place: map,
									probability,
									timeWindow,
								},
								collectionPoint
							),
						]
					)
				)
			)
		);
	});

	const fishingMaps = [
		...(item.from.fishing ?? []),
		...(item.from.fishingAdvanced ?? []),
	];

	fishingMaps.forEach((map) => {
		const mapDisplayLabel = formatMap(map);
		results.push(
			createResult([
				combineAvailabilityPaths(
					createAvailabilityPath(
						[MAP_FACTS[map].dlc],
						`钓鱼地点：${mapDisplayLabel}`,
						{
							acquisitionSources: [
								{
									kind: 'fishing',
									name: mapDisplayLabel,
									place: map,
									probability: null,
									timeWindow: null,
								},
							],
							isFishingPath: true,
						}
					),
					createDlcPath(4, 'DLC4 钓鱼能力', { isFishingPath: true })
				),
			])
		);
	});

	item.from.task?.forEach((task) => {
		results.push(
			createResult([
				resolveFoodTaskAvailabilityPath(task, `任务：${task.task}`),
			])
		);
	});

	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`食物“${item.name}”`
	);
}

function resolveBuyAvailabilityResult(
	merchant: TMerchantReference,
	price: unknown,
	fallbackDlc: TDlc
) {
	return combineMerchantAndCurrencyItemPaths(
		merchant,
		fallbackDlc,
		formatPurchaseSource(merchant, price),
		getCurrencyItemIdsFromPrice(price),
		getCurrencyItemAvailabilityResultMap()
	);
}

function formatFoodSource({ from, name }: (typeof FOOD_LIST)[number]) {
	if ('areaTask' in from) {
		const specialGuestSuffix =
			'specialGuest' in from.areaTask
				? `（${getSpecialGuest(from.areaTask.specialGuest).name}）`
				: '';
		return `地区【${formatMap(from.areaTask.map)}】${from.areaTask.task}${specialGuestSuffix}`;
	}
	if ('collaboration' in from) {
		return from.collaboration.merchants
			.map(({ merchant, platformLabel }, index) => {
				const merchantName =
					index === 0 && 'map' in merchant
						? `【${formatMap(merchant.map)}“${from.collaboration.collaborationLabel}”联动】${merchant.label}`
						: formatMerchantReference(merchant);
				return `${merchantName}（${platformLabel}）`;
			})
			.join('、');
	}
	if ('failedCooking' in from) {
		return [
			...from.failedCooking.causeLabels,
			...from.failedCooking.punishmentSpellCardSpecialGuests.map(
				(specialGuest) =>
					`【${getSpecialGuest(specialGuest).name}】惩罚符卡`
			),
		].join('、');
	}
	throw new Error(`料理“${name}”没有文本来源`);
}

function projectFoodSource(item: (typeof FOOD_LIST)[number]) {
	if ('self' in item.from) {
		return { self: true };
	}
	if ('bond' in item.from) {
		return {
			bond: {
				level: item.from.bond.level,
				name: getSpecialGuest(item.from.bond.specialGuest).name,
			},
		};
	}
	if ('levelup' in item.from) {
		return {
			levelup: [
				item.from.levelup.level,
				item.from.levelup.map === null
					? null
					: formatMap(item.from.levelup.map),
			],
		};
	}
	if ('buy' in item.from) {
		return {
			buy: {
				name: formatMerchantReference(item.from.buy.merchant),
				price: projectPrice(item.from.buy.price),
			},
		};
	}
	return formatFoodSource(item);
}

function resolveFoodItemAvailabilityResult(item: (typeof FOOD_LIST)[number]) {
	if ('self' in item.from) {
		return createResult([
			createDlcPath(0, '初始食谱', {
				acquisitionSources: [
					{
						kind: 'self',
						name: '初始食谱',
						place: null,
						probability: null,
						timeWindow: null,
					},
				],
			}),
		]);
	}
	if ('bond' in item.from) {
		const specialGuest = getSpecialGuest(item.from.bond.specialGuest);
		return resolveSpecialGuestBondAvailabilityResult(
			item.from.bond.specialGuest,
			`【${specialGuest.name}】羁绊 Lv.${item.from.bond.level - 1} ➞ Lv.${item.from.bond.level}`
		);
	}
	if ('buy' in item.from) {
		const { merchant, price } = item.from.buy;
		return resolveBuyAvailabilityResult(merchant, price, item.dlc);
	}
	if ('levelup' in item.from) {
		const { level, map } = item.from.levelup;
		const acquisitionSources: IAvailabilityAcquisitionSource[] = [
			{
				kind: 'levelup',
				name: `Lv.${level}`,
				place: map,
				probability: null,
				timeWindow: null,
			},
		];
		return createResult([
			map === null
				? createDlcPath(0, `游戏等级 Lv.${level - 1} ➞ Lv.${level}`, {
						acquisitionSources,
					})
				: resolveMapAvailabilityPath(
						map,
						`游戏等级 Lv.${level - 1} ➞ Lv.${level} 且已解锁地区【${formatMap(map)}】`,
						acquisitionSources
					),
		]);
	}
	return createOpaqueSourceResult(formatFoodSource(item), item.dlc);
}

function formatCookerSource(
	source: (typeof COOKER_LIST)[number]['from'][number]
) {
	if ('dlcSideTask' in source) {
		return `【DLC${source.dlcSideTask.dlc}】${source.dlcSideTask.task}`;
	}
	if ('competitionReward' in source) {
		return `完成“${source.competitionReward.competitionLabel}”后自动获得`;
	}
	throw new Error('厨具来源不是文本来源');
}

function projectCookerSource(
	source: (typeof COOKER_LIST)[number]['from'][number]
) {
	if ('self' in source) {
		return { self: true };
	}
	if ('bond' in source) {
		return { bond: getSpecialGuest(source.bond.specialGuest).name };
	}
	if ('buy' in source) {
		return {
			buy: {
				name: formatMerchantReference(source.buy.merchant),
				price: projectPrice(source.buy.price),
			},
		};
	}
	return formatCookerSource(source);
}

function resolveCookerAvailabilityResult(item: (typeof COOKER_LIST)[number]) {
	const results = item.from.map((source): IAvailabilityResult => {
		if ('self' in source) {
			return createResult([
				createDlcPath(0, '初始获得', {
					acquisitionSources: [
						{
							kind: 'self',
							name: '初始获得',
							place: null,
							probability: null,
							timeWindow: null,
						},
					],
				}),
			]);
		}
		if ('bond' in source) {
			const specialGuest = getSpecialGuest(source.bond.specialGuest);
			return resolveSpecialGuestBondAvailabilityResult(
				source.bond.specialGuest,
				`羁绊：${specialGuest.name}`
			);
		}
		if ('buy' in source) {
			return resolveBuyAvailabilityResult(
				source.buy.merchant,
				source.buy.price,
				item.dlc
			);
		}
		return createOpaqueSourceResult(formatCookerSource(source), item.dlc);
	});

	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`厨具“${item.name}”`
	);
}

function formatClothesSource(
	source: (typeof CLOTHES_LIST)[number]['from'][number]
) {
	if ('holdingRequirement' in source) {
		return `持有${source.holdingRequirement.amount}枚“${getCurrencyItem(source.holdingRequirement.currencyItem).name}”时自动获得`;
	}
	if ('eventReward' in source) {
		return `${source.eventReward.eventLabel}时自动获得`;
	}
	if ('collaborationUnlock' in source) {
		return `开启联动【${source.collaborationUnlock.collaborationLabel}】后自动获得`;
	}
	if ('taskReward' in source) {
		return `完成“${source.taskReward.task}”任务后自动获得`;
	}
	throw new Error('服装来源不是文本来源');
}

function projectClothesSource(
	source: (typeof CLOTHES_LIST)[number]['from'][number]
) {
	if ('self' in source) {
		return { self: true };
	}
	if ('bond' in source) {
		return { bond: getSpecialGuest(source.bond.specialGuest).name };
	}
	if ('buy' in source) {
		return {
			buy: {
				name: formatMerchantReference(source.buy.merchant),
				price: projectPrice(source.buy.price),
			},
		};
	}
	return formatClothesSource(source);
}

function resolveClothesAvailabilityResult(item: (typeof CLOTHES_LIST)[number]) {
	const results = item.from.map((source): IAvailabilityResult => {
		if ('self' in source) {
			return createResult([
				createDlcPath(0, '初始获得', {
					acquisitionSources: [
						{
							kind: 'self',
							name: '初始获得',
							place: null,
							probability: null,
							timeWindow: null,
						},
					],
				}),
			]);
		}
		if ('bond' in source) {
			const specialGuest = getSpecialGuest(source.bond.specialGuest);
			return resolveSpecialGuestBondAvailabilityResult(
				source.bond.specialGuest,
				`羁绊：${specialGuest.name}`
			);
		}
		if ('buy' in source) {
			return resolveBuyAvailabilityResult(
				source.buy.merchant,
				source.buy.price,
				item.dlc
			);
		}
		return createOpaqueSourceResult(formatClothesSource(source), item.dlc);
	});

	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`衣服“${item.name}”`
	);
}

function formatDecorationSource(item: (typeof DECORATION_LIST)[number]) {
	const { from, name } = item;
	if ('collaboration' in from) {
		return `开启联动【${from.collaboration.collaborationLabel}】后自动获得`;
	}
	if ('completion' in from) {
		const [firstMap, secondMap] = from.completion.maps;
		return `地区【${formatMap(firstMap)}】和【${formatMap(secondMap)}】全部稀客羁绊满级，并完成【DLC${from.completion.story.dlc}】${from.completion.story.conditionLabel}后，和【${getSpecialGuest(from.completion.specialGuest).name}】对话领取。`;
	}
	throw new Error(`摆件“${name}”没有文本来源`);
}

function projectDecorationSource(item: (typeof DECORATION_LIST)[number]) {
	if ('bond' in item.from) {
		return {
			bond: getSpecialGuest(item.from.bond.specialGuest).name,
			description:
				'task' in item.from
					? `并完成任务【${item.from.task.task}】（前往${formatMap(item.from.task.map)}的${item.from.task.locationLabel}与${item.from.task.dialogueGuestLabel}交谈）。`
					: null,
			level: item.from.bond.level,
		};
	}
	return formatDecorationSource(item);
}

function resolveDecorationAvailabilityResult(
	item: (typeof DECORATION_LIST)[number]
) {
	if ('bond' in item.from) {
		const specialGuest = getSpecialGuest(item.from.bond.specialGuest);
		return resolveSpecialGuestBondAvailabilityResult(
			item.from.bond.specialGuest,
			`【${specialGuest.name}】羁绊 Lv.${item.from.bond.level - 1} ➞ Lv.${item.from.bond.level}`
		);
	}
	return createOpaqueSourceResult(formatDecorationSource(item), item.dlc);
}

function formatPartnerSource(item: (typeof PARTNER_LIST)[number]) {
	const { from, name } = item;
	if ('unlockedMapDialogue' in from) {
		return `解锁地区【${formatMap(from.unlockedMapDialogue.map)}】后，和【${getSpecialGuest(from.unlockedMapDialogue.specialGuest).name}】对话。`;
	}
	if ('datedMapTrial' in from) {
		return `解锁地区【${formatMap(from.datedMapTrial.map)}】后，完成由【${getSpecialGuest(from.datedMapTrial.specialGuest).name}】于${from.datedMapTrial.month}月${from.datedMapTrial.day}日发起的试炼。`;
	}
	if ('storyDialogue' in from) {
		return `${from.storyDialogue.prerequisiteLabel}后，和地区【${from.storyDialogue.placeLabel}】的【${getSpecialGuest(from.storyDialogue.specialGuest).name}】对话，选择“${from.storyDialogue.dialogueOptionLabel}”。`;
	}
	throw new Error(`伙伴“${name}”没有文本来源`);
}

function projectPartnerSource(item: (typeof PARTNER_LIST)[number]) {
	if ('self' in item.from) {
		return { self: true };
	}
	if ('mapMainTask' in item.from) {
		return { task: formatMap(item.from.mapMainTask.map) };
	}
	if ('allMapSpecialGuestBondsMaxed' in item.from) {
		return { place: formatMap(item.from.allMapSpecialGuestBondsMaxed.map) };
	}
	return formatPartnerSource(item);
}

function resolvePartnerAvailabilityResult(item: (typeof PARTNER_LIST)[number]) {
	if ('self' in item.from) {
		return createResult([
			createDlcPath(0, '初始伙伴', {
				acquisitionSources: [
					{
						kind: 'self',
						name: '初始伙伴',
						place: null,
						probability: null,
						timeWindow: null,
					},
				],
			}),
		]);
	}
	if ('mapMainTask' in item.from) {
		const { map } = item.from.mapMainTask;
		const mapDisplayLabel = formatMap(map);
		return createResult([
			resolveMapAvailabilityPath(map, `地区任务：${mapDisplayLabel}`, [
				{
					kind: 'task',
					name: mapDisplayLabel,
					place: map,
					probability: null,
					timeWindow: null,
				},
			]),
		]);
	}
	if ('allMapSpecialGuestBondsMaxed' in item.from) {
		const { map } = item.from.allMapSpecialGuestBondsMaxed;
		const mapDisplayLabel = formatMap(map);
		return createResult([
			resolveMapAvailabilityPath(map, `地区解锁：${mapDisplayLabel}`, [
				{
					kind: 'unknown',
					name: mapDisplayLabel,
					place: map,
					probability: null,
					timeWindow: null,
				},
			]),
		]);
	}
	return createOpaqueSourceResult(formatPartnerSource(item), item.dlc);
}

function createAuditEntry(
	category: TAvailabilityCategory,
	item: { dlc: TDlc; id: number; name: string },
	rawFrom: unknown,
	result: IAvailabilityResult
): IAvailabilityAuditEntry {
	return {
		...result,
		category,
		contentDlc: item.dlc,
		id: item.id,
		name: item.name,
		rawFrom,
	};
}

function resolveGuestAvailabilityResult(
	category: 'normalGuest' | 'specialGuest',
	item: { dlc: TDlc; id: number; name: string }
) {
	const paths = [
		createDlcPath(item.dlc, `内容存在：${DLC_LABEL_MAP[item.dlc].label}`, {
			acquisitionSources: [
				{
					kind: 'content',
					name: item.name,
					place: null,
					probability: null,
					timeWindow: null,
				},
			],
		}),
	];
	if (category === 'specialGuest' && item.id === 10) {
		paths.push(
			createDlcPath(0, '本体特殊来店', {
				acquisitionSources: [
					{
						kind: 'content',
						name: '本体特殊来店',
						place: null,
						probability: null,
						timeWindow: null,
					},
				],
			})
		);
	}
	return createResult(paths);
}

export function deriveAllAvailabilityEntries() {
	const entries: IAvailabilityAuditEntry[] = [];

	BEVERAGE_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'beverage',
				item,
				projectFoodFrom(item.from),
				resolveFoodAvailabilityResult(item)
			)
		);
	});
	CLOTHES_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'clothes',
				item,
				item.from.map(projectClothesSource),
				resolveClothesAvailabilityResult(item)
			)
		);
	});
	COOKER_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'cooker',
				item,
				item.from.map(projectCookerSource),
				resolveCookerAvailabilityResult(item)
			)
		);
	});
	CURRENCY_ITEM_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'currencyItem',
				item,
				item.from.map(projectCurrencyItemSource),
				deriveCurrencyItemAvailabilityResult(item.id)
			)
		);
	});
	DECORATION_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'decoration',
				item,
				projectDecorationSource(item),
				resolveDecorationAvailabilityResult(item)
			)
		);
	});
	FOOD_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'food',
				item,
				projectFoodSource(item),
				resolveFoodItemAvailabilityResult(item)
			)
		);
	});
	INGREDIENT_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'ingredient',
				item,
				projectFoodFrom(item.from),
				resolveFoodAvailabilityResult(item)
			)
		);
	});
	NORMAL_GUEST_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'normalGuest',
				item,
				{ places: item.maps.map(formatMap) },
				resolveGuestAvailabilityResult('normalGuest', item)
			)
		);
	});
	PARTNER_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'partner',
				item,
				projectPartnerSource(item),
				resolvePartnerAvailabilityResult(item)
			)
		);
	});
	SPECIAL_GUEST_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'specialGuest',
				item,
				{ places: item.maps.map(formatMap) },
				resolveGuestAvailabilityResult('specialGuest', item)
			)
		);
	});

	return entries;
}
