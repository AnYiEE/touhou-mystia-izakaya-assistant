import {
	COLLECTION_LOCATION_REFRESH_TIME_MAP,
	PLACE_UNLOCK_TIER_MAP,
	type TDlc,
	type TPlace,
} from '@/data';
import {
	type IAvailabilityAcquisitionSource,
	type IAvailabilityPath,
} from '@/utils/availability';

const GAME_DAY_START_HOUR = 10;
const GAME_DAY_END_HOUR = 18;
const GAME_DAY_HOURS = GAME_DAY_END_HOUR - GAME_DAY_START_HOUR;
const COLLECT_CHANNEL_BONUS = 1.2;

export interface IRecommendationPriorityMetrics {
	readonly acquisitionEase: number;
	readonly contentMismatchCount: number;
	readonly customerPlacesMismatchCount: number;
	readonly lateSourceCount: number;
	readonly maxLateTierDistance: number;
	readonly pathMismatchCount: number;
	readonly primaryPlaceMismatchCount: number;
	readonly totalLateTierDistance: number;
	readonly unknownSourceCount: number;
}

export interface ISelectedRecommendationAvailabilityPath extends IRecommendationPriorityMetrics {
	readonly path: IAvailabilityPath;
}

interface IRecommendationAvailabilityContext {
	readonly customerDlc: TDlc;
	readonly customerPlaces: ReadonlyArray<TPlace>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
}

interface IRecommendationItemAvailability extends IRecommendationAvailabilityContext {
	readonly allowFishingFallback: boolean;
	readonly availabilityPaths: ReadonlyArray<IAvailabilityPath>;
	readonly contentDlc: TDlc;
}

interface ISourcePlaceMetrics {
	readonly customerPlacesMismatchCount: number;
	readonly lateSourceCount: number;
	readonly maxLateTierDistance: number;
	readonly primaryPlaceMismatchCount: number;
	readonly totalLateTierDistance: number;
	readonly unknownSourceCount: number;
}

export const EMPTY_RECOMMENDATION_PRIORITY_METRICS: IRecommendationPriorityMetrics =
	{
		acquisitionEase: 0,
		contentMismatchCount: 0,
		customerPlacesMismatchCount: 0,
		lateSourceCount: 0,
		maxLateTierDistance: 0,
		pathMismatchCount: 0,
		primaryPlaceMismatchCount: 0,
		totalLateTierDistance: 0,
		unknownSourceCount: 0,
	};

export function compareRecommendationStrictMetrics(
	left: IRecommendationPriorityMetrics,
	right: IRecommendationPriorityMetrics
) {
	return (
		left.contentMismatchCount - right.contentMismatchCount ||
		left.pathMismatchCount - right.pathMismatchCount ||
		left.primaryPlaceMismatchCount - right.primaryPlaceMismatchCount ||
		left.customerPlacesMismatchCount - right.customerPlacesMismatchCount ||
		left.unknownSourceCount - right.unknownSourceCount ||
		left.lateSourceCount - right.lateSourceCount ||
		left.maxLateTierDistance - right.maxLateTierDistance ||
		left.totalLateTierDistance - right.totalLateTierDistance
	);
}

export function compareRecommendationPriorityMetrics(
	left: IRecommendationPriorityMetrics,
	right: IRecommendationPriorityMetrics
) {
	return (
		compareRecommendationStrictMetrics(left, right) ||
		right.acquisitionEase - left.acquisitionEase
	);
}

export function addRecommendationPriorityMetrics(
	left: IRecommendationPriorityMetrics,
	right: IRecommendationPriorityMetrics
): IRecommendationPriorityMetrics {
	return {
		acquisitionEase: left.acquisitionEase + right.acquisitionEase,
		contentMismatchCount:
			left.contentMismatchCount + right.contentMismatchCount,
		customerPlacesMismatchCount:
			left.customerPlacesMismatchCount +
			right.customerPlacesMismatchCount,
		lateSourceCount: left.lateSourceCount + right.lateSourceCount,
		maxLateTierDistance: Math.max(
			left.maxLateTierDistance,
			right.maxLateTierDistance
		),
		pathMismatchCount: left.pathMismatchCount + right.pathMismatchCount,
		primaryPlaceMismatchCount:
			left.primaryPlaceMismatchCount + right.primaryPlaceMismatchCount,
		totalLateTierDistance:
			left.totalLateTierDistance + right.totalLateTierDistance,
		unknownSourceCount: left.unknownSourceCount + right.unknownSourceCount,
	};
}

function getNaturalDlcs(customerDlc: TDlc) {
	return customerDlc === 0
		? new Set<TDlc>([0])
		: new Set<TDlc>([0, customerDlc]);
}

function getSourcePlaceMetrics(
	source: IAvailabilityAcquisitionSource,
	customerPlaces: ReadonlyArray<TPlace>
): ISourcePlaceMetrics {
	if (source.kind === 'self') {
		return {
			customerPlacesMismatchCount: 0,
			lateSourceCount: 0,
			maxLateTierDistance: 0,
			primaryPlaceMismatchCount: 0,
			totalLateTierDistance: 0,
			unknownSourceCount: 0,
		};
	}

	const [primaryPlace] = customerPlaces;
	if (source.place === null || primaryPlace === undefined) {
		return {
			customerPlacesMismatchCount: 1,
			lateSourceCount: 0,
			maxLateTierDistance: 0,
			primaryPlaceMismatchCount: 1,
			totalLateTierDistance: 0,
			unknownSourceCount: 1,
		};
	}

	const isCustomerPlace = customerPlaces.includes(source.place);
	const tierDistance = isCustomerPlace
		? 0
		: Math.max(
				0,
				PLACE_UNLOCK_TIER_MAP[source.place] -
					PLACE_UNLOCK_TIER_MAP[primaryPlace]
			);

	return {
		customerPlacesMismatchCount: isCustomerPlace ? 0 : 1,
		lateSourceCount: tierDistance > 0 ? 1 : 0,
		maxLateTierDistance: tierDistance,
		primaryPlaceMismatchCount: source.place === primaryPlace ? 0 : 1,
		totalLateTierDistance: tierDistance,
		unknownSourceCount: 0,
	};
}

function compareSourcePlaceMetrics(
	left: ISourcePlaceMetrics,
	right: ISourcePlaceMetrics
) {
	return (
		left.primaryPlaceMismatchCount - right.primaryPlaceMismatchCount ||
		left.customerPlacesMismatchCount - right.customerPlacesMismatchCount ||
		left.unknownSourceCount - right.unknownSourceCount ||
		left.lateSourceCount - right.lateSourceCount ||
		left.maxLateTierDistance - right.maxLateTierDistance ||
		left.totalLateTierDistance - right.totalLateTierDistance
	);
}

function getPathSourcePlaceMetrics(
	path: IAvailabilityPath,
	customerPlaces: ReadonlyArray<TPlace>
) {
	let bestMetrics: ISourcePlaceMetrics | null = null;

	for (const source of path.acquisitionSources) {
		const metrics = getSourcePlaceMetrics(source, customerPlaces);
		if (
			bestMetrics === null ||
			compareSourcePlaceMetrics(metrics, bestMetrics) < 0
		) {
			bestMetrics = metrics;
		}
	}

	return (
		bestMetrics ?? {
			customerPlacesMismatchCount: 1,
			lateSourceCount: 0,
			maxLateTierDistance: 0,
			primaryPlaceMismatchCount: 1,
			totalLateTierDistance: 0,
			unknownSourceCount: 1,
		}
	);
}

function getCollectEase(source: IAvailabilityAcquisitionSource) {
	if (!Object.hasOwn(COLLECTION_LOCATION_REFRESH_TIME_MAP, source.name)) {
		return 0;
	}
	const refreshHours =
		COLLECTION_LOCATION_REFRESH_TIME_MAP[
			source.name as keyof typeof COLLECTION_LOCATION_REFRESH_TIME_MAP
		];
	if (refreshHours === null) {
		return 0;
	}

	const [startHour, endHour] = source.timeWindow ?? [
		GAME_DAY_START_HOUR,
		GAME_DAY_END_HOUR,
	];
	const timeWindowFraction =
		Math.max(
			0,
			Math.min(endHour, GAME_DAY_END_HOUR) -
				Math.max(startHour, GAME_DAY_START_HOUR)
		) / GAME_DAY_HOURS;

	return (
		((source.probability ?? 100) / 100) *
		timeWindowFraction *
		(1 / refreshHours) *
		COLLECT_CHANNEL_BONUS
	);
}

function getPathAcquisitionEase(path: IAvailabilityPath) {
	if (path.acquisitionSources.some(({ kind }) => kind === 'self')) {
		return Infinity;
	}

	return path.acquisitionSources.reduce((total, source) => {
		if (source.kind === 'collect') {
			return total + getCollectEase(source);
		}
		if (source.kind === 'buy') {
			return total + (source.probability ?? 100) / 100 / GAME_DAY_HOURS;
		}
		return total;
	}, 0);
}

function createPathMetrics(
	path: IAvailabilityPath,
	{
		customerDlc,
		customerPlaces,
	}: Pick<
		IRecommendationAvailabilityContext,
		'customerDlc' | 'customerPlaces'
	>
): ISelectedRecommendationAvailabilityPath {
	const naturalDlcs = getNaturalDlcs(customerDlc);
	const placeMetrics = getPathSourcePlaceMetrics(path, customerPlaces);

	return {
		...placeMetrics,
		acquisitionEase: getPathAcquisitionEase(path),
		contentMismatchCount: 0,
		path,
		pathMismatchCount: path.requiredDlcs.filter(
			(dlc) => !naturalDlcs.has(dlc)
		).length,
	};
}

function compareSelectedPaths(
	left: ISelectedRecommendationAvailabilityPath,
	right: ISelectedRecommendationAvailabilityPath
) {
	return compareRecommendationPriorityMetrics(left, right);
}

export function selectRecommendationAvailabilityPath({
	allowFishingFallback,
	availabilityPaths,
	customerDlc,
	customerPlaces,
	hiddenDlcs,
}: Omit<IRecommendationItemAvailability, 'contentDlc'>) {
	const legalPaths = availabilityPaths.filter(({ requiredDlcs }) =>
		requiredDlcs.every((dlc) => dlc === 0 || !hiddenDlcs.has(dlc))
	);
	const nonFishingPaths = legalPaths.filter(
		({ isFishingPath }) => !isFishingPath
	);
	const candidatePaths =
		nonFishingPaths.length > 0
			? nonFishingPaths
			: allowFishingFallback
				? legalPaths
				: [];

	let bestPath: ISelectedRecommendationAvailabilityPath | null = null;
	for (const path of candidatePaths) {
		const selected = createPathMetrics(path, {
			customerDlc,
			customerPlaces,
		});
		if (bestPath === null || compareSelectedPaths(selected, bestPath) < 0) {
			bestPath = selected;
		}
	}

	return bestPath;
}

export function getRecommendationItemPriority({
	allowFishingFallback,
	availabilityPaths,
	contentDlc,
	customerDlc,
	customerPlaces,
	hiddenDlcs,
}: IRecommendationItemAvailability): IRecommendationPriorityMetrics | null {
	const selectedPath = selectRecommendationAvailabilityPath({
		allowFishingFallback,
		availabilityPaths,
		customerDlc,
		customerPlaces,
		hiddenDlcs,
	});
	if (selectedPath === null) {
		return null;
	}

	return {
		acquisitionEase: selectedPath.acquisitionEase,
		contentMismatchCount: Number(contentDlc !== customerDlc),
		customerPlacesMismatchCount: selectedPath.customerPlacesMismatchCount,
		lateSourceCount: selectedPath.lateSourceCount,
		maxLateTierDistance: selectedPath.maxLateTierDistance,
		pathMismatchCount: selectedPath.pathMismatchCount,
		primaryPlaceMismatchCount: selectedPath.primaryPlaceMismatchCount,
		totalLateTierDistance: selectedPath.totalLateTierDistance,
		unknownSourceCount: selectedPath.unknownSourceCount,
	};
}
