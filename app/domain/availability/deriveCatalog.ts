import isObject from 'lodash/isObject.js';

import { BADGE_LIST } from '@/domain/data/badges/records';
import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import type { IClothes } from '@/domain/data/clothes/schema';
import { COOKER_LIST } from '@/domain/data/cookers/records';
import type { ICooker } from '@/domain/data/cookers/schema';
import { CURRENCY_ITEM_LIST } from '@/domain/data/currencyItems/records';
import type { ICurrencyItem } from '@/domain/data/currencyItems/schema';
import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import { DECORATION_LIST } from '@/domain/data/decorations/records';
import { getDecorationSources } from '@/domain/data/decorations/sources';
import { FISHING_COLLECTIBLE_LIST } from '@/domain/data/fishingCollectibles/records';
import { FOOD_LIST } from '@/domain/data/foods/records';
import type { IFood } from '@/domain/data/foods/schema';
import { GENERAL_ITEM_LIST } from '@/domain/data/generalItems/records';
import { NORMAL_GUEST_LIST } from '@/domain/data/guests/normal/records';
import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import { type TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import { PRAYER_LABEL_MAP } from '@/domain/data/labels/prayerFacts';
import {
	SCHEDULER_FACTS,
	formatSchedulerLabels,
} from '@/domain/data/labels/schedulerFacts';
import { PARTNER_LIST } from '@/domain/data/partners/records';
import { getCollectionPointFact } from '@/domain/data/places/collectionFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type {
	TCollectionPointReference,
	TMerchantReference,
} from '@/domain/data/places/types';
import { RECORD_LIST } from '@/domain/data/records/records';
import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import { getSourceEntries } from '@/domain/data/shared/sourceEntries';
import type { TDlc } from '@/domain/data/shared/types';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';
import { formatSchedulerTaskLabel } from '@/domain/labels/localizedSchedulerLabels';
import { extractMapsFromCollectionPoint } from '@/domain/places/collectionLocations';
import { getMapLabel, getPlaceLabel } from '@/domain/places/localizedLabels';
import { getPointLabel } from '@/domain/places/localizedPointLabels';

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

type TCurrencyItemSource = ReturnType<
	typeof getSourceEntries<ICurrencyItem['from']>
>[number];
type TClothesSource = ReturnType<
	typeof getSourceEntries<IClothes['from']>
>[number];
type TCookerSource = ReturnType<
	typeof getSourceEntries<ICooker['from']>
>[number];
type TDecorationSource = ReturnType<typeof getDecorationSources>[number];
type TFoodSource = ReturnType<typeof getSourceEntries<IFood['from']>>[number];

let currencyItemAvailabilityResultMap:
	ReadonlyMap<TCurrencyItemId, IAvailabilityResult> | undefined;

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

export function formatCollectionPointReference(
	collectionPoint: TCollectionPointReference
) {
	if ('map' in collectionPoint) {
		const label = getPointLabel(
			getCollectionPointFact(collectionPoint)?.displayLabel ??
				('labels' in collectionPoint
					? collectionPoint.labels.join('、')
					: collectionPoint.label) ??
				''
		);
		return `【${getMapLabel(collectionPoint.map)}】${label}`;
	}
	const excludedMaps = collectionPoint.excludedMaps
		.map((map) => `【${getMapLabel(map)}】`)
		.join('、');
	return `非${excludedMaps}${getPointLabel(
		getCollectionPointFact(collectionPoint)?.displayLabel ?? ''
	)}`;
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
		'cooker' in price &&
		typeof price.amount === 'number' &&
		typeof price.cooker === 'number'
	) {
		const cooker = COOKER_LIST.find(({ id }) => id === price.cooker);
		if (cooker === undefined) {
			throw new Error(`找不到厨具“${price.cooker}”`);
		}
		return { amount: price.amount, cooker: cooker.name };
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
	if ('cooker' in price) {
		return projectPrice(price.cooker);
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
			'cooker' in projectedValue &&
			typeof projectedValue.amount === 'number' &&
			typeof projectedValue.cooker === 'string'
		) {
			return [`${projectedValue.amount}×${projectedValue.cooker}`];
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

function formatCollaborationTerminalSource(label: TCollaborationLabel) {
	return `通过联动终端【${getCollaborationLabel(label)}】选项领取`;
}

function hasCollaborationTerminal(
	source: object
): source is { collaboration: { collaborationLabel: TCollaborationLabel } } {
	return 'collaboration' in source;
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

function formatCurrencyItemSource(source: TCurrencyItemSource) {
	if ('collaboration' in source) {
		return formatCollaborationTerminalSource(
			source.collaboration.collaborationLabel
		);
	}
	if ('mapPrayer' in source) {
		return `地区【${getMapLabel(source.mapPrayer.map)}】${PRAYER_LABEL_MAP[source.mapPrayer.label]}处祈愿`;
	}
	if ('mapSideTask' in source) {
		return `地区任务：${getMapLabel(source.mapSideTask.map)}`;
	}
	if ('spellCardReward' in source) {
		return `【${getSpecialGuest(source.spellCardReward.specialGuest).name}】奖励符卡`;
	}
	return formatPurchaseSource(source.buy.merchant, source.buy.price);
}

function projectCurrencyItemSource(source: TCurrencyItemSource) {
	if ('buy' in source) {
		return {
			buy: {
				name: formatMerchantReference(source.buy.merchant),
				price: projectPrice(source.buy.price),
			},
		};
	}
	if ('mapSideTask' in source) {
		return { task: getMapLabel(source.mapSideTask.map) };
	}
	return formatCurrencyItemSource(source);
}

function resolveCurrencyItemNonBuySource(
	source: TCurrencyItemSource,
	contentDlc: TDlc
) {
	if ('buy' in source) {
		return createResult([]);
	}
	if ('mapSideTask' in source) {
		const { map } = source.mapSideTask;
		const mapDisplayLabel = getMapLabel(map);
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
				getSourceEntries<ICurrencyItem['from']>(currencyItem.from)
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

			const buyResults = getSourceEntries<ICurrencyItem['from']>(
				currencyItem.from
			).flatMap((source) => {
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
	if (from.collaboration !== undefined) {
		projectedFrom['collaboration'] = from.collaboration.map(
			({ collaborationLabel }) =>
				getCollaborationLabel(collaborationLabel)
		);
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
		projectedFrom['fishing'] = from.fishing.map(getMapLabel);
	}
	if (from.fishingAdvanced !== undefined) {
		projectedFrom['fishingAdvanced'] =
			from.fishingAdvanced.map(getMapLabel);
	}
	if (from.prayer !== undefined) {
		projectedFrom['prayer'] = from.prayer.map(
			(reference) =>
				`【${getMapLabel(reference.map)}】${PRAYER_LABEL_MAP[reference.label]}`
		);
	}
	if (from.self !== undefined) {
		projectedFrom['self'] = from.self;
	}
	if (from.task !== undefined) {
		projectedFrom['task'] = from.task.map(({ task }) =>
			formatSchedulerLabels(task)
		);
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

	item.from.collaboration?.forEach(({ collaborationLabel }) => {
		results.push(
			createOpaqueSourceResult(
				formatCollaborationTerminalSource(collaborationLabel),
				item.dlc
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

	item.from.prayer?.forEach((prayer) => {
		const prayerName = `【${getMapLabel(prayer.map)}】${PRAYER_LABEL_MAP[prayer.label]}`;
		results.push(
			createResult([
				resolveMapAvailabilityPath(prayer.map, `祈愿：${prayerName}`, [
					{
						kind: 'prayer',
						name: prayerName,
						place: prayer.map,
						probability: null,
						timeWindow: null,
					},
				]),
			])
		);
	});

	const fishingMaps = [
		...(item.from.fishing ?? []),
		...(item.from.fishingAdvanced ?? []),
	];

	fishingMaps.forEach((map) => {
		const mapDisplayLabel = getMapLabel(map);
		results.push(
			createResult([
				combineAvailabilityPaths(
					createAvailabilityPath(
						[MAP_FACTS[map].dlc],
						`垂钓地点：${mapDisplayLabel}`,
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
					createDlcPath(4, 'DLC4垂钓能力', { isFishingPath: true })
				),
			])
		);
	});

	item.from.task?.forEach((task) => {
		const taskName = formatSchedulerLabels(task.task);
		results.push(
			createResult([
				resolveFoodTaskAvailabilityPath(task, `任务：${taskName}`),
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

function formatFoodSource(from: TFoodSource) {
	if ('areaTask' in from) {
		const specialGuestSuffix =
			'specialGuest' in from.areaTask
				? `（${getSpecialGuest(from.areaTask.specialGuest).name}）`
				: '';
		return `地区【${getMapLabel(from.areaTask.map)}】${from.areaTask.task}${specialGuestSuffix}`;
	}
	if ('collaboration' in from) {
		const { collaboration } = from;
		const { collaborationLabel: collaborationId } = collaboration;
		const collaborationLabel = getCollaborationLabel(collaborationId);
		if ('merchants' in collaboration) {
			return collaboration.merchants
				.map(({ merchant, platformLabel }, index) => {
					const merchantName =
						index === 0 && 'map' in merchant
							? `【${getMapLabel(merchant.map)}“${collaborationLabel}”联动】${formatMerchantReference(merchant).replace(/^【[^】]+】/u, '')}`
							: formatMerchantReference(merchant);
					return `${merchantName}（${platformLabel}）`;
				})
				.join('、');
		}
		return formatCollaborationTerminalSource(collaborationId);
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
	if ('taskReward' in from) {
		return `任务${formatSchedulerTaskLabel(formatSchedulerLabels(from.taskReward.task))}`;
	}
	throw new Error('料理来源不是文本来源');
}

function projectFoodSource(item: (typeof FOOD_LIST)[number]) {
	return getSourceEntries<IFood['from']>(item.from).map((source) => {
		if ('self' in source) {
			return { self: true };
		}
		if ('bond' in source) {
			return {
				bond: {
					level: source.bond.level,
					name: getSpecialGuest(source.bond.specialGuest).name,
				},
			};
		}
		if ('buy' in source) {
			return {
				buy: {
					name: formatMerchantReference(source.buy.merchant),
					price: projectPrice(source.buy.price),
				},
			};
		}
		if ('levelup' in source) {
			return {
				levelup: [
					source.levelup.level,
					source.levelup.map === null
						? null
						: getMapLabel(source.levelup.map),
				],
			};
		}
		return formatFoodSource(source);
	});
}

function resolveFoodItemAvailabilityResult(item: (typeof FOOD_LIST)[number]) {
	const results = getSourceEntries<IFood['from']>(item.from).map(
		(source): IAvailabilityResult => {
			if ('self' in source) {
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
			if ('bond' in source) {
				const specialGuest = getSpecialGuest(source.bond.specialGuest);
				return resolveSpecialGuestBondAvailabilityResult(
					source.bond.specialGuest,
					`【${specialGuest.name}】羁绊Lv.${source.bond.level - 1}➞Lv.${source.bond.level}`
				);
			}
			if ('buy' in source) {
				const { merchant, price } = source.buy;
				return resolveBuyAvailabilityResult(merchant, price, item.dlc);
			}
			if ('levelup' in source) {
				const { level, map } = source.levelup;
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
						? createDlcPath(
								0,
								`游戏等级Lv.${level - 1}➞Lv.${level}`,
								{ acquisitionSources }
							)
						: resolveMapAvailabilityPath(
								map,
								`游戏等级Lv.${level - 1}➞Lv.${level}且已解锁地区【${getMapLabel(map)}】`,
								acquisitionSources
							),
				]);
			}
			if ('taskReward' in source) {
				return createResult([
					resolveFoodTaskAvailabilityPath(
						source.taskReward,
						`任务${formatSchedulerTaskLabel(formatSchedulerLabels(source.taskReward.task))}`
					),
				]);
			}
			return createOpaqueSourceResult(formatFoodSource(source), item.dlc);
		}
	);
	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`料理“${item.name}”`
	);
}

function formatCookerSource(source: TCookerSource) {
	if (hasCollaborationTerminal(source)) {
		return formatCollaborationTerminalSource(
			source.collaboration.collaborationLabel
		);
	}
	if ('competitionReward' in source) {
		return `完成“${formatSchedulerLabels(source.competitionReward.competitionLabel)}”后自动获得`;
	}
	if ('dlcSideTask' in source) {
		return `【DLC${source.dlcSideTask.dlc}】${source.dlcSideTask.task}`;
	}
	throw new Error('厨具来源不是文本来源');
}

function projectCookerSource(source: TCookerSource) {
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
	const results = getSourceEntries<ICooker['from']>(item.from).map(
		(source): IAvailabilityResult => {
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
			return createOpaqueSourceResult(
				formatCookerSource(source),
				item.dlc
			);
		}
	);

	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`厨具“${item.name}”`
	);
}

function formatClothesSource(source: TClothesSource) {
	if ('collaboration' in source) {
		return formatCollaborationTerminalSource(
			source.collaboration.collaborationLabel
		);
	}
	if ('eventReward' in source) {
		return `${formatSchedulerLabels(source.eventReward.eventLabel)}时自动获得`;
	}
	if ('holdingRequirement' in source) {
		return `持有${source.holdingRequirement.amount}枚“${getCurrencyItem(source.holdingRequirement.currencyItem).name}”时自动获得`;
	}
	if ('taskReward' in source) {
		return `任务${formatSchedulerTaskLabel(formatSchedulerLabels(source.taskReward.task))}`;
	}
	throw new Error('服装来源不是文本来源');
}

function projectClothesSource(source: TClothesSource) {
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
	const results = getSourceEntries<IClothes['from']>(item.from).map(
		(source): IAvailabilityResult => {
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
			return createOpaqueSourceResult(
				formatClothesSource(source),
				item.dlc
			);
		}
	);

	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`衣服“${item.name}”`
	);
}

function formatDecorationSource(source: TDecorationSource) {
	if ('collaboration' in source) {
		return formatCollaborationTerminalSource(
			source.collaboration.collaborationLabel
		);
	}
	if ('completion' in source) {
		const [firstMap, secondMap] = source.completion.maps;
		return `地区【${getMapLabel(firstMap)}】和【${getMapLabel(secondMap)}】全部稀客羁绊满级，并完成【DLC${source.completion.story.dlc}】${source.completion.story.conditionLabel}后，和【${getSpecialGuest(source.completion.specialGuest).name}】对话领取。`;
	}
	throw new Error('摆件来源不是文本来源');
}

function projectDecorationSource(item: (typeof DECORATION_LIST)[number]) {
	return getDecorationSources(item.from).map((source) => {
		if ('bond' in source) {
			const taskFact =
				'task' in source
					? SCHEDULER_FACTS[source.task.startEventLabel]
					: undefined;
			return {
				bond: getSpecialGuest(source.bond.specialGuest).name,
				description:
					'task' in source
						? `并完成任务【${formatSchedulerLabels(source.task.missionLabel)}】（前往${getMapLabel(source.task.map)}的${taskFact?.locationLabel}与${taskFact?.dialogueGuestLabel}交谈）。`
						: null,
				level: source.bond.level,
			};
		}
		return formatDecorationSource(source);
	});
}

function resolveDecorationAvailabilityResult(
	item: (typeof DECORATION_LIST)[number]
) {
	const results = getDecorationSources(item.from).map(
		(source): IAvailabilityResult => {
			if ('bond' in source) {
				const specialGuest = getSpecialGuest(source.bond.specialGuest);
				return resolveSpecialGuestBondAvailabilityResult(
					source.bond.specialGuest,
					`【${specialGuest.name}】羁绊Lv.${source.bond.level - 1}➞Lv.${source.bond.level}`
				);
			}
			return createOpaqueSourceResult(
				formatDecorationSource(source),
				item.dlc
			);
		}
	);
	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`摆件“${item.name}”`
	);
}

function formatPartnerSource(item: (typeof PARTNER_LIST)[number]) {
	const { from, name } = item;
	if ('unlockedMapDialogue' in from) {
		return `解锁地区【${getMapLabel(from.unlockedMapDialogue.map)}】后，和【${getSpecialGuest(from.unlockedMapDialogue.specialGuest).name}】对话。`;
	}
	if ('datedMapTrial' in from) {
		return `解锁地区【${getMapLabel(from.datedMapTrial.map)}】后，完成由【${getSpecialGuest(from.datedMapTrial.specialGuest).name}】于${from.datedMapTrial.month}月${from.datedMapTrial.day}日发起的试炼。`;
	}
	if ('storyDialogue' in from) {
		return `${from.storyDialogue.prerequisiteLabel}后，和地区【${getPlaceLabel(from.storyDialogue.placeLabel)}】的【${getSpecialGuest(from.storyDialogue.specialGuest).name}】对话，选择“${from.storyDialogue.dialogueOptionLabel}”。`;
	}
	throw new Error(`伙伴“${name}”没有文本来源`);
}

function projectPartnerSource(item: (typeof PARTNER_LIST)[number]) {
	if ('self' in item.from) {
		return { self: true };
	}
	if ('allMapSpecialGuestBondsMaxed' in item.from) {
		return {
			place: getMapLabel(item.from.allMapSpecialGuestBondsMaxed.map),
		};
	}
	if ('mapMainTask' in item.from) {
		return { task: getMapLabel(item.from.mapMainTask.map) };
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
	if ('allMapSpecialGuestBondsMaxed' in item.from) {
		const { map } = item.from.allMapSpecialGuestBondsMaxed;
		const mapDisplayLabel = getMapLabel(map);
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
	if ('mapMainTask' in item.from) {
		const { map } = item.from.mapMainTask;
		const mapDisplayLabel = getMapLabel(map);
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

function resolveContentAvailabilityResult(item: { dlc: TDlc; name: string }) {
	return createResult([
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
	]);
}

function resolveFishingCollectibleAvailabilityResult(
	item: (typeof FISHING_COLLECTIBLE_LIST)[number]
) {
	const mapName = getMapLabel(item.map);
	return createResult([
		createAvailabilityPath(
			[4, item.requiredContentDlc],
			`垂钓：${mapName}`,
			{
				acquisitionSources: [
					{
						kind: 'fishing',
						name: mapName,
						place: item.map,
						probability: null,
						timeWindow: null,
					},
				],
				isFishingPath: true,
			}
		),
	]);
}

export function deriveAllAvailabilityEntries() {
	const entries: IAvailabilityAuditEntry[] = [];

	BADGE_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'badge',
				item,
				item.description,
				resolveContentAvailabilityResult(item)
			)
		);
	});
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
				getSourceEntries<IClothes['from']>(item.from).map(
					projectClothesSource
				),
				resolveClothesAvailabilityResult(item)
			)
		);
	});
	COOKER_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'cooker',
				item,
				getSourceEntries<ICooker['from']>(item.from).map(
					projectCookerSource
				),
				resolveCookerAvailabilityResult(item)
			)
		);
	});
	CURRENCY_ITEM_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'currencyItem',
				item,
				getSourceEntries<ICurrencyItem['from']>(item.from).map(
					projectCurrencyItemSource
				),
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
	FISHING_COLLECTIBLE_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'fishingCollectible',
				item,
				{ map: getMapLabel(item.map) },
				resolveFishingCollectibleAvailabilityResult(item)
			)
		);
	});
	GENERAL_ITEM_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'generalItem',
				item,
				item.from,
				resolveContentAvailabilityResult(item)
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
				{ places: item.maps.map(getMapLabel) },
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
	RECORD_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'record',
				item,
				item.buy,
				resolveContentAvailabilityResult(item)
			)
		);
	});
	SPECIAL_GUEST_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'specialGuest',
				item,
				{ places: item.maps.map(getMapLabel) },
				resolveGuestAvailabilityResult('specialGuest', item)
			)
		);
	});

	return entries;
}
