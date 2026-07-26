import {
	COLLECTION_LOCATION_REFRESH_TIME_MAP,
	DYNAMIC_TAG_MAP,
	PLACE_UNLOCK_TIER_MAP,
} from '@/data';
import { Beverage, Cooker, CustomerRare, Ingredient, Recipe } from '@/utils';
import type { IAvailabilityPath } from '@/utils/availability/types';

interface IRecommendationCacheNamespaceParams {
	readonly algorithmVersion: number;
	readonly dataFingerprint: string;
	readonly epoch: number;
	readonly recordVersion: number;
}

function serializeNumber(value: number) {
	if (!Number.isFinite(value)) {
		throw new TypeError(
			'recommendation-cache-fingerprint-non-finite-number'
		);
	}
	return Object.is(value, -0) ? '0' : String(value);
}

export function stableSerialize(value: unknown): string {
	if (value === null) {
		return 'null';
	}
	if (typeof value === 'string') {
		return JSON.stringify(value);
	}
	if (typeof value === 'number') {
		return serializeNumber(value);
	}
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}
	if (Array.isArray(value)) {
		return `[${value.map(stableSerialize).join(',')}]`;
	}
	if (typeof value === 'object') {
		const object = value as Record<string, unknown>;
		return `{${Object.keys(object)
			.sort()
			.map(
				(key) =>
					`${JSON.stringify(key)}:${stableSerialize(object[key])}`
			)
			.join(',')}}`;
	}

	throw new TypeError('recommendation-cache-fingerprint-unsupported-value');
}

function hashString(value: string, seed: number) {
	let hash = seed;
	for (const character of value) {
		hash ^= character.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 16_777_619);
	}
	return hash >>> 0;
}

export function createStableFingerprint(value: unknown) {
	const serialized = stableSerialize(value);
	return [
		hashString(serialized, 2_166_136_261),
		hashString(serialized, 0x9e3779b9),
	]
		.map((hash) => hash.toString(16).padStart(8, '0'))
		.join('');
}

export function createRecommendationCacheNamespace({
	algorithmVersion,
	dataFingerprint,
	epoch,
	recordVersion,
}: IRecommendationCacheNamespaceParams) {
	return `r${recordVersion}:e${epoch}:a${algorithmVersion}:d${dataFingerprint}`;
}

export function createRecommendationCacheRuntimeChannel(isProduction: boolean) {
	return isProduction ? 'production' : 'development';
}

function projectAvailabilityPaths(
	availabilityPaths: ReadonlyArray<IAvailabilityPath>
) {
	const compareSerialized = (left: unknown, right: unknown) => {
		const serializedLeft = stableSerialize(left);
		const serializedRight = stableSerialize(right);
		return serializedLeft < serializedRight
			? -1
			: serializedLeft > serializedRight
				? 1
				: 0;
	};
	return availabilityPaths
		.map(({ acquisitionSources, isFishingPath, requiredDlcs }) => ({
			acquisitionSources: acquisitionSources
				.map(({ kind, name, place, probability, timeWindow }) => ({
					kind,
					name,
					place,
					probability,
					timeWindow,
				}))
				.sort(compareSerialized),
			isFishingPath,
			requiredDlcs: [...requiredDlcs].sort((left, right) => left - right),
		}))
		.sort(compareSerialized);
}

function sortStrings(values: ReadonlyArray<string>) {
	return [...values].sort();
}

export function createRecommendationDataFingerprint() {
	const customers = CustomerRare.getInstance().data.map(
		({
			availabilityPaths,
			beverageTags,
			dlc,
			enduranceLimit,
			name,
			negativeTags,
			places,
			positiveTags,
			price,
		}) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			beverageTags: sortStrings(beverageTags),
			dlc,
			enduranceLimit,
			name,
			negativeTags: sortStrings(negativeTags),
			places,
			positiveTags: sortStrings(positiveTags),
			price,
		})
	);
	const beverages = Beverage.getInstance().data.map(
		({ availabilityPaths, dlc, level, name, price, tags }) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			dlc,
			level,
			name,
			price,
			tags: sortStrings(tags),
		})
	);
	const cookers = Cooker.getInstance().data.map(
		({ availabilityPaths, category, name }) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			category,
			name,
		})
	);
	const ingredients = Ingredient.getInstance().data.map(
		({ availabilityPaths, dlc, level, name, price, tags }) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			dlc,
			level,
			name,
			price,
			tags: sortStrings(tags),
		})
	);
	const recipes = Recipe.getInstance().data.map(
		({
			availabilityPaths,
			cooker,
			dlc,
			ingredients: fixedIngredients,
			level,
			name,
			negativeTags,
			positiveTags,
			price,
		}) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			cooker,
			dlc,
			fixedIngredients: sortStrings(fixedIngredients),
			level,
			name,
			negativeTags: sortStrings(negativeTags),
			positiveTags: sortStrings(positiveTags),
			price,
		})
	);

	return createStableFingerprint({
		beverages,
		collectionLocationRefreshTimeMap: COLLECTION_LOCATION_REFRESH_TIME_MAP,
		cookers,
		customers,
		dynamicTagMap: DYNAMIC_TAG_MAP,
		ingredients,
		placeUnlockTierMap: PLACE_UNLOCK_TIER_MAP,
		recipes,
		tagCoverMap: Recipe.tagCoverMap,
	});
}
