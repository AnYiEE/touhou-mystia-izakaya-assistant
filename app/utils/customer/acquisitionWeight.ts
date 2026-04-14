import {
	COLLECTION_LOCATION_REFRESH_TIME_MAP,
	type TBeverageName,
	type TDlc,
	type TIngredientName,
	type TPlace,
} from '@/data';

const GAME_DAY_HOURS = 8;

const MAP_NAME_REGEX = /^【(.+?)】/u;

/* eslint-disable sort-keys */
export const MAP_DLC: Record<TPlace, TDlc> = {
	妖怪兽道: 0,
	人间之里: 0,
	博丽神社: 0,
	红魔馆: 0,
	迷途竹林: 0,
	魔法森林: 1,
	妖怪之山: 1,
	旧地狱: 2,
	地灵殿: 2,
	命莲寺: 3,
	神灵庙: 3,
	太阳花田: 4,
	辉针城: 4,
	月之都: 5,
	魔界: 5,
};

const MAP_UNLOCK_TIER: Record<TPlace, number> = {
	妖怪兽道: 0,
	人间之里: 1,
	魔法森林: 1,
	妖怪之山: 1,
	博丽神社: 2,
	旧地狱: 2,
	地灵殿: 2,
	红魔馆: 3,
	命莲寺: 3,
	神灵庙: 3,
	迷途竹林: 4,
	太阳花田: 4,
	辉针城: 4,
	月之都: 5,
	魔界: 5,
};
/* eslint-enable sort-keys */

const CROSS_DLC_MAP_WEIGHT = 0.25;
const COLLECT_CHANNEL_BONUS = 1.2;
const CUSTOMER_HOME_MAP_WEIGHT = 1.5;
const FALLBACK_MAP_WEIGHT = 0.05;
const OWN_DLC_MAP_BONUS = 1.2;
const PROGRESSION_DECAY_PER_TIER = 0.9;
const RECIPE_INGREDIENT_COUNT_EXPONENT = 0.5;

interface IAcquisitionSource {
	readonly buy?: ReadonlyArray<string | ReadonlyArray<unknown>>;
	readonly collect?: ReadonlyArray<string | ReadonlyArray<unknown>>;
	readonly self?: boolean;
	readonly [key: string]: unknown;
}

function getMapWeight(name: string, customerDlc: TDlc, customerPlace: TPlace) {
	const match = MAP_NAME_REGEX.exec(name);
	if (!match?.[1]) {
		return FALLBACK_MAP_WEIGHT;
	}

	const place = match[1] as TPlace;
	if (!(place in MAP_DLC)) {
		return FALLBACK_MAP_WEIGHT;
	}

	const mapDlc = MAP_DLC[place];
	const dlcFactor =
		customerDlc !== 0 && mapDlc === customerDlc
			? OWN_DLC_MAP_BONUS
			: mapDlc === 0 || mapDlc === customerDlc
				? 1
				: CROSS_DLC_MAP_WEIGHT;
	const homeFactor = place === customerPlace ? CUSTOMER_HOME_MAP_WEIGHT : 1;
	const customerTier = MAP_UNLOCK_TIER[customerPlace];
	const mapTier = MAP_UNLOCK_TIER[place];
	const progressionFactor =
		mapTier > customerTier
			? PROGRESSION_DECAY_PER_TIER ** (mapTier - customerTier)
			: 1;

	return dlcFactor * homeFactor * progressionFactor;
}

function parseSourceEntry(entry: string | ReadonlyArray<unknown>): {
	name: string;
	probability: number;
} {
	if (typeof entry === 'string') {
		return { name: entry, probability: 100 };
	}

	const [name, prob] = entry as [string, (number | boolean)?];

	return { name, probability: typeof prob === 'number' ? prob : 100 };
}

function computeCollectEntryScore(
	entry: string | ReadonlyArray<unknown>,
	customerDlc: TDlc,
	customerPlace: TPlace
) {
	const { name, probability } = parseSourceEntry(entry);

	const refreshTime = COLLECTION_LOCATION_REFRESH_TIME_MAP[
		name as keyof typeof COLLECTION_LOCATION_REFRESH_TIME_MAP
	] as number | null | undefined;

	if (refreshTime === null || refreshTime === undefined) {
		return 0;
	}

	const timeWindowFrac =
		typeof entry !== 'string' && entry.length >= 4
			? Math.max(
					0,
					(Math.min(entry[3] as number, 18) -
						Math.max(entry[2] as number, 10)) /
						GAME_DAY_HOURS
				)
			: 1;

	return (
		(probability / 100) *
		timeWindowFrac *
		(1 / refreshTime) *
		getMapWeight(name, customerDlc, customerPlace) *
		COLLECT_CHANNEL_BONUS
	);
}

function computeBuyEntryScore(
	entry: string | ReadonlyArray<unknown>,
	customerDlc: TDlc,
	customerPlace: TPlace
) {
	const { name, probability } = parseSourceEntry(entry);

	return (
		(probability / 100) *
		(1 / GAME_DAY_HOURS) *
		getMapWeight(name, customerDlc, customerPlace)
	);
}

function getAcquisitionEase(
	from: IAcquisitionSource,
	customerDlc: TDlc,
	customerPlace: TPlace
) {
	if (from.self === true) {
		return Infinity;
	}

	const totalCollectScore =
		from.collect?.reduce(
			(sum, entry) =>
				sum +
				computeCollectEntryScore(entry, customerDlc, customerPlace),
			0
		) ?? 0;
	const totalBuyScore =
		from.buy?.reduce(
			(sum, entry) =>
				sum + computeBuyEntryScore(entry, customerDlc, customerPlace),
			0
		) ?? 0;
	const totalScore = totalCollectScore + totalBuyScore;

	return totalScore === 0 ? Infinity : totalScore;
}

function computeMaxEase(easeMap: ReadonlyMap<string, number>) {
	return [...easeMap.values()].reduce(
		(max, ease) => (ease !== Infinity && ease > max ? ease : max),
		0
	);
}

export function buildEaseMap<T extends string>(
	items: ReadonlyArray<{ name: T; from: IAcquisitionSource }>,
	customerDlc: TDlc,
	customerPlace: TPlace
): { easeMap: Map<T, number>; maxEase: number } {
	const easeMap = new Map<T, number>(
		items.map((item): [T, number] => [
			item.name,
			getAcquisitionEase(item.from, customerDlc, customerPlace),
		])
	);

	return { easeMap, maxEase: computeMaxEase(easeMap) };
}

function normalizeEase(
	name: string,
	easeMap: ReadonlyMap<string, number>,
	maxEase: number
) {
	const ease = easeMap.get(name) ?? 0;

	if (ease === Infinity || maxEase <= 0) {
		return 1;
	}

	return ease / maxEase;
}

export function getIngredientPenalty(
	name: TIngredientName,
	ingredientEaseMap: ReadonlyMap<TIngredientName, number>,
	maxIngredientEase: number
) {
	return 30 * (1 - normalizeEase(name, ingredientEaseMap, maxIngredientEase));
}

export function getBeverageAcquisitionWeight(
	beverageName: TBeverageName,
	beverageEaseMap: ReadonlyMap<TBeverageName, number>,
	maxBeverageEase: number
) {
	return normalizeEase(beverageName, beverageEaseMap, maxBeverageEase) * 100;
}

export function getRecipeAcquisitionWeight(
	ingredients: ReadonlyArray<TIngredientName>,
	ingredientEaseMap: ReadonlyMap<TIngredientName, number>,
	maxIngredientEase: number
) {
	if (ingredients.length === 0 || maxIngredientEase <= 0) {
		return 100;
	}

	const n = ingredients.length;
	const totalInverseNormalized = ingredients.reduce((sum, name) => {
		const normalized = normalizeEase(
			name,
			ingredientEaseMap,
			maxIngredientEase
		);

		return sum + (normalized > 0 ? 1 / normalized : Infinity);
	}, 0);

	if (
		!Number.isFinite(totalInverseNormalized) ||
		totalInverseNormalized <= 0
	) {
		return 0;
	}

	return (
		(n ** RECIPE_INGREDIENT_COUNT_EXPONENT / totalInverseNormalized) * 100
	);
}
