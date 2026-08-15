import { getAvailabilityCollectionPointReference } from '@/domain/availability/acquisitionSourceMetadata';
import type { IAvailabilityPath } from '@/domain/availability/types';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import { COLLECTION_POINT_REFRESH_FACTS } from '@/domain/data/places/collectionFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';

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
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}
	if (typeof value === 'number') {
		return serializeNumber(value);
	}
	if (typeof value === 'string') {
		return JSON.stringify(value);
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
				.map((source) => {
					const projectedSource = {
						kind: source.kind,
						place: source.place,
						probability: source.probability,
						timeWindow: source.timeWindow,
					};
					const collectionPoint =
						getAvailabilityCollectionPointReference(source);

					return collectionPoint === undefined
						? projectedSource
						: { ...projectedSource, collectionPoint };
				})
				.sort(compareSerialized),
			isFishingPath,
			requiredDlcs: requiredDlcs.toSorted((left, right) => left - right),
		}))
		.sort(compareSerialized);
}

function sortCookerTypes(availableTypes: ReadonlyArray<TCookerTypeId>) {
	return availableTypes.toSorted((left, right) => left - right);
}

export function createRecommendationDataFingerprintFacts() {
	const specialGuests = SpecialGuestCatalog.getInstance().data.map(
		({
			availabilityPaths,
			beverageTags,
			dlc,
			enduranceLimit,
			id,
			maps,
			negativeTags,
			positiveTags,
			price,
		}) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			beverageTags: beverageTags.toSorted((a, b) => a - b),
			dlc,
			enduranceLimit,
			id,
			maps: maps.toSorted(),
			negativeTags: negativeTags.toSorted((a, b) => a - b),
			positiveTags: positiveTags.toSorted((a, b) => a - b),
			price,
		})
	);
	const beverages = BeverageCatalog.getInstance().data.map(
		({ availabilityPaths, dlc, id, level, price, tags }) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			dlc,
			id,
			level,
			price,
			tags: tags.toSorted((a, b) => a - b),
		})
	);
	const foods = FoodCatalog.getInstance().data.map(
		({
			availabilityPaths,
			dlc,
			id,
			level,
			negativeTags,
			positiveTags,
			price,
			recipes,
		}) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			dlc,
			id,
			level,
			negativeTags: negativeTags.toSorted((a, b) => a - b),
			positiveTags: positiveTags.toSorted((a, b) => a - b),
			price,
			recipes: recipes
				.map(({ cookerType, id, ingredients }) => ({
					cookerType,
					id,
					ingredients: ingredients.toSorted((a, b) => a - b),
				}))
				.sort((left, right) => left.id - right.id),
		})
	);
	const ingredients = IngredientCatalog.getInstance().data.map(
		({ availabilityPaths, dlc, id, level, price, tags, type }) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			dlc,
			id,
			level,
			price,
			tags: tags.toSorted((a, b) => a - b),
			type,
		})
	);
	const cookers = CookerCatalog.getInstance().data.map(
		({ availabilityPaths, availableTypes, dlc, id, series }) => ({
			availabilityPaths: projectAvailabilityPaths(availabilityPaths),
			availableTypes: sortCookerTypes(availableTypes),
			dlc,
			id,
			series,
		})
	);

	return {
		beverages,
		collectionPointRefreshFacts: COLLECTION_POINT_REFRESH_FACTS,
		cookers,
		dynamicFoodTagMap: DYNAMIC_FOOD_TAG_MAP,
		foods,
		ingredients,
		mapUnlockTierMap: Object.fromEntries(
			Object.entries(MAP_FACTS).map(([map, { unlockTier }]) => [
				map,
				unlockTier,
			])
		),
		specialGuests,
		tagCoverMap: FoodCatalog.tagCoverMap,
	};
}

export function createRecommendationDataFingerprint() {
	return createStableFingerprint(createRecommendationDataFingerprintFacts());
}
