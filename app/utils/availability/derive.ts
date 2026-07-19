import {
	BEVERAGE_LIST,
	CLOTHES_LIST,
	COOKER_LIST,
	CURRENCY_LIST,
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_RARE_LIST,
	DLC_LABEL_MAP,
	INGREDIENT_LIST,
	ORNAMENT_LIST,
	PARTNER_LIST,
	RECIPE_LIST,
	type TCollectionLocation,
	type TCurrencyName,
	type TDlc,
	type TPlace,
} from '@/data';
import { extractPlacesFromCollectionLocation } from '@/data/utils';
import type { IFoodBase, TMerchant } from '@/data/types';

import {
	combineAvailabilityPaths,
	createAvailabilityPath,
	normalizeAvailabilityPaths,
} from './path';
import {
	resolveFoodTaskAvailabilityPath,
	resolveMerchantAvailabilityResult,
	resolvePlaceAvailabilityPath,
	resolveRareCustomerBondAvailabilityResult,
} from './sourceResolvers';
import type {
	IAvailabilityAuditEntry,
	IAvailabilityPath,
	IAvailabilityResult,
	TAvailabilityCategory,
} from './types';

type TFoodTask = NonNullable<IFoodBase['from']['task']>[number];

interface IFoodAvailabilityFrom {
	buy?: ReadonlyArray<TMerchant | readonly [TMerchant, boolean | number]>;
	collect?: ReadonlyArray<
		| TCollectionLocation
		| readonly [TCollectionLocation, boolean | number]
		| readonly [TCollectionLocation, boolean | number, number, number]
	>;
	fishing?: ReadonlyArray<TPlace>;
	fishingAdvanced?: ReadonlyArray<TPlace>;
	self?: true;
	task?: ReadonlyArray<TFoodTask>;
}

interface IFoodAvailabilityItem {
	dlc: TDlc;
	from: IFoodAvailabilityFrom;
	name: string;
}

let currencyAvailabilityResultMap:
	| ReadonlyMap<TCurrencyName, IAvailabilityResult>
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

function createDlcPath(dlc: TDlc, source: string) {
	return createAvailabilityPath([dlc], source);
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
		[createDlcPath(dlc, `归属回退：${dlcLabel}`)],
		[`${context}无法精确解析，已回退到内容归属${dlcLabel}`]
	);
}

function resolveTextAvailabilityResult(
	value: string,
	contentDlc: TDlc,
	context: string
) {
	return value === ''
		? createFallbackResult(contentDlc, context)
		: createResult([createDlcPath(contentDlc, value)]);
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

function getCurrencyNamesFromPrice(price: unknown) {
	const values = Array.isArray(price) ? price : [price];
	const currencyNames: string[] = [];

	values.forEach((value) => {
		if (
			typeof value === 'object' &&
			value !== null &&
			'currency' in value &&
			typeof value.currency === 'string'
		) {
			currencyNames.push(value.currency);
		}
	});

	return currencyNames;
}

function formatPurchaseSource(merchant: TMerchant, price: unknown) {
	const values = Array.isArray(price) ? price : [price];
	const priceParts = values.flatMap((value) => {
		if (typeof value === 'number') {
			return [String(value)];
		}
		if (
			typeof value === 'object' &&
			value !== null &&
			'amount' in value &&
			'currency' in value &&
			typeof value.amount === 'number' &&
			typeof value.currency === 'string'
		) {
			return [`${value.amount}×${value.currency}`];
		}

		return [];
	});

	return priceParts.length === 0
		? `购买：${merchant}`
		: `购买：${merchant}（${priceParts.join(' + ')}）`;
}

function combineMerchantAndCurrencyPaths(
	merchant: TMerchant,
	fallbackDlc: TDlc,
	source: string,
	currencyNames: ReadonlyArray<string>,
	currencyResults: ReadonlyMap<TCurrencyName, IAvailabilityResult>
) {
	const merchantResult = resolveMerchantAvailabilityResult(
		merchant,
		fallbackDlc,
		source
	);
	const diagnostics = [...merchantResult.diagnostics];
	let combinedPaths = merchantResult.availabilityPaths.map((path) =>
		createAvailabilityPath(path.requiredDlcs, path.sources[0] ?? source)
	);

	currencyNames.forEach((currencyName) => {
		const currencyResult = currencyResults.get(
			currencyName as TCurrencyName
		);
		if (currencyResult === undefined) {
			diagnostics.push(`购买路径引用了未知货币“${currencyName}”`);
			combinedPaths = [];
			return;
		}

		const prerequisitePaths = getMinimalPrerequisitePaths(
			currencyResult.availabilityPaths
		);
		combinedPaths = combinedPaths.flatMap((itemPath) =>
			prerequisitePaths.map((currencyPath) =>
				createAvailabilityPath(
					[...itemPath.requiredDlcs, ...currencyPath.requiredDlcs],
					source
				)
			)
		);
		diagnostics.push(...currencyResult.diagnostics);
	});

	return createResult(combinedPaths, diagnostics);
}

function resolveCurrencyNonBuySource(
	source: (typeof CURRENCY_LIST)[number]['from'][number],
	contentDlc: TDlc
) {
	if (typeof source === 'string') {
		return resolveTextAvailabilityResult(
			source,
			contentDlc,
			`货币来源“${source}”`
		);
	}

	if ('task' in source) {
		return createResult([
			resolvePlaceAvailabilityPath(
				source.task,
				`地区任务：${source.task}`
			),
		]);
	}

	return createResult([]);
}

function buildCurrencyAvailabilityResultMap() {
	const resultMap = new Map<TCurrencyName, IAvailabilityResult>();

	CURRENCY_LIST.forEach((currency) => {
		resultMap.set(
			currency.name,
			mergeResults(
				currency.from
					.filter(
						(source) =>
							typeof source === 'string' || !('buy' in source)
					)
					.map((source) =>
						resolveCurrencyNonBuySource(source, currency.dlc)
					)
			)
		);
	});

	let hasChanged = true;
	while (hasChanged) {
		hasChanged = false;

		for (const currency of CURRENCY_LIST) {
			const currentResult = resultMap.get(currency.name);
			if (currentResult === undefined) {
				continue;
			}

			const buyResults = currency.from.flatMap((source) => {
				if (typeof source === 'string' || !('buy' in source)) {
					return [];
				}

				return [
					combineMerchantAndCurrencyPaths(
						source.buy.name,
						currency.dlc,
						formatPurchaseSource(source.buy.name, source.buy.price),
						getCurrencyNamesFromPrice(source.buy.price),
						resultMap
					),
				];
			});
			const nextResult = mergeResults([currentResult, ...buyResults]);

			if (JSON.stringify(nextResult) !== JSON.stringify(currentResult)) {
				resultMap.set(currency.name, nextResult);
				hasChanged = true;
			}
		}
	}

	CURRENCY_LIST.forEach((currency) => {
		const result = resultMap.get(currency.name);
		if (result !== undefined) {
			resultMap.set(
				currency.name,
				ensureResultHasPath(
					result,
					currency.dlc,
					`货币“${currency.name}”`
				)
			);
		}
	});

	return resultMap;
}

function getCurrencyAvailabilityResultMap() {
	currencyAvailabilityResultMap ??= buildCurrencyAvailabilityResultMap();
	return currencyAvailabilityResultMap;
}

export function deriveCurrencyAvailabilityResult(currencyName: TCurrencyName) {
	const currency = CURRENCY_LIST.find(({ name }) => name === currencyName);
	const result = getCurrencyAvailabilityResultMap().get(currencyName);

	if (currency === undefined || result === undefined) {
		return createResult([], [`找不到货币“${currencyName}”`]);
	}

	return result;
}

function resolveFoodAvailabilityResult(item: IFoodAvailabilityItem) {
	const results: IAvailabilityResult[] = [];

	if (item.from.self === true) {
		results.push(createResult([createDlcPath(0, '初始获得')]));
	}

	item.from.buy?.forEach((entry) => {
		const merchant = typeof entry === 'string' ? entry : entry[0];
		results.push(
			resolveMerchantAvailabilityResult(
				merchant,
				item.dlc,
				`购买：${merchant}`
			)
		);
	});

	item.from.collect?.forEach((entry) => {
		const location = typeof entry === 'string' ? entry : entry[0];
		const places = extractPlacesFromCollectionLocation(location);

		results.push(
			places.length === 0
				? createFallbackResult(item.dlc, `采集地点“${location}”`)
				: createResult(
						places.map((place) =>
							resolvePlaceAvailabilityPath(
								place,
								`采集：${location}`
							)
						)
					)
		);
	});

	const fishingEntries = [
		...(item.from.fishing ?? []),
		...(item.from.fishingAdvanced ?? []),
	];
	fishingEntries.forEach((place) => {
		results.push(
			createResult([
				combineAvailabilityPaths(
					resolvePlaceAvailabilityPath(place, `钓鱼地点：${place}`),
					createDlcPath(4, 'DLC4 钓鱼能力')
				),
			])
		);
	});

	item.from.task?.forEach((task) => {
		results.push(
			createResult([
				resolveFoodTaskAvailabilityPath(task, `任务：${task}`),
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
	merchant: TMerchant,
	price: unknown,
	fallbackDlc: TDlc
) {
	return combineMerchantAndCurrencyPaths(
		merchant,
		fallbackDlc,
		formatPurchaseSource(merchant, price),
		getCurrencyNamesFromPrice(price),
		getCurrencyAvailabilityResultMap()
	);
}

function resolveRecipeAvailabilityResult(item: (typeof RECIPE_LIST)[number]) {
	if (typeof item.from === 'string') {
		return resolveTextAvailabilityResult(
			item.from,
			item.dlc,
			`食谱“${item.name}”`
		);
	}

	const results: IAvailabilityResult[] = [];
	if ('self' in item.from) {
		results.push(createResult([createDlcPath(0, '初始食谱')]));
	}
	if ('bond' in item.from) {
		results.push(
			resolveRareCustomerBondAvailabilityResult(
				item.from.bond.name,
				`羁绊：${item.from.bond.name} Lv.${item.from.bond.level}`
			)
		);
	}
	if ('buy' in item.from) {
		results.push(
			resolveBuyAvailabilityResult(
				item.from.buy.name,
				item.from.buy.price,
				item.dlc
			)
		);
	}
	if ('levelup' in item.from) {
		const [level, place] = item.from.levelup;
		results.push(
			createResult([
				place === null
					? createDlcPath(0, `升级：Lv.${level}`)
					: resolvePlaceAvailabilityPath(
							place,
							`地区升级：${place} Lv.${level}`
						),
			])
		);
	}

	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`食谱“${item.name}”`
	);
}

function resolveArrayItemAvailabilityResult(
	category: 'clothes' | 'cooker',
	item: (typeof CLOTHES_LIST)[number] | (typeof COOKER_LIST)[number]
) {
	const categoryLabel = category === 'clothes' ? '衣服' : '厨具';
	const results = item.from.map((source): IAvailabilityResult => {
		if (typeof source === 'string') {
			return resolveTextAvailabilityResult(
				source,
				item.dlc,
				`${categoryLabel}“${item.name}”来源`
			);
		}

		if ('self' in source) {
			return createResult([createDlcPath(0, '初始获得')]);
		}
		if ('bond' in source) {
			return resolveRareCustomerBondAvailabilityResult(
				source.bond,
				`羁绊：${source.bond}`
			);
		}
		if ('buy' in source) {
			return resolveBuyAvailabilityResult(
				source.buy.name,
				source.buy.price,
				item.dlc
			);
		}

		return createResult([]);
	});

	return ensureResultHasPath(
		mergeResults(results),
		item.dlc,
		`${categoryLabel}“${item.name}”`
	);
}

function resolveOrnamentAvailabilityResult(
	item: (typeof ORNAMENT_LIST)[number]
) {
	if (typeof item.from !== 'string') {
		return resolveRareCustomerBondAvailabilityResult(
			item.from.bond,
			`羁绊：${item.from.bond} Lv.${item.from.level}`
		);
	}

	return resolveTextAvailabilityResult(
		item.from,
		item.dlc,
		`摆件“${item.name}”来源`
	);
}

function resolvePartnerAvailabilityResult(item: (typeof PARTNER_LIST)[number]) {
	if (typeof item.from === 'string') {
		return resolveTextAvailabilityResult(
			item.from,
			item.dlc,
			`伙伴“${item.name}”来源`
		);
	}

	if ('self' in item.from) {
		return createResult([createDlcPath(0, '初始伙伴')]);
	}
	if ('place' in item.from) {
		return createResult([
			resolvePlaceAvailabilityPath(
				item.from.place,
				`地区解锁：${item.from.place}`
			),
		]);
	}
	if ('task' in item.from) {
		return createResult([
			resolvePlaceAvailabilityPath(
				item.from.task,
				`地区任务：${item.from.task}`
			),
		]);
	}

	return createFallbackResult(item.dlc, `伙伴“${item.name}”`);
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

function resolveCustomerAvailabilityResult(
	category: 'customerNormal' | 'customerRare',
	item: { dlc: TDlc; name: string }
) {
	const paths = [
		createDlcPath(item.dlc, `内容存在：${DLC_LABEL_MAP[item.dlc].label}`),
	];
	if (category === 'customerRare' && item.name === '雾雨魔理沙') {
		paths.push(createDlcPath(0, '本体特殊来店'));
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
				item.from,
				resolveFoodAvailabilityResult(item)
			)
		);
	});
	CLOTHES_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'clothes',
				item,
				item.from,
				resolveArrayItemAvailabilityResult('clothes', item)
			)
		);
	});
	COOKER_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'cooker',
				item,
				item.from,
				resolveArrayItemAvailabilityResult('cooker', item)
			)
		);
	});
	CURRENCY_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'currency',
				item,
				item.from,
				deriveCurrencyAvailabilityResult(item.name)
			)
		);
	});
	CUSTOMER_NORMAL_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'customerNormal',
				item,
				{ places: item.places },
				resolveCustomerAvailabilityResult('customerNormal', item)
			)
		);
	});
	CUSTOMER_RARE_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'customerRare',
				item,
				{ places: item.places },
				resolveCustomerAvailabilityResult('customerRare', item)
			)
		);
	});
	INGREDIENT_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'ingredient',
				item,
				item.from,
				resolveFoodAvailabilityResult(item)
			)
		);
	});
	ORNAMENT_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'ornament',
				item,
				item.from,
				resolveOrnamentAvailabilityResult(item)
			)
		);
	});
	PARTNER_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'partner',
				item,
				item.from,
				resolvePartnerAvailabilityResult(item)
			)
		);
	});
	RECIPE_LIST.forEach((item) => {
		entries.push(
			createAuditEntry(
				'recipe',
				item,
				item.from,
				resolveRecipeAvailabilityResult(item)
			)
		);
	});

	return entries;
}
