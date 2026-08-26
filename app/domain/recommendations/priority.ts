import isNil from 'lodash/isNil.js';

import { getAvailabilityCollectionPointReference } from '@/domain/availability/acquisitionSourceMetadata';
import type {
	IAvailabilityAcquisitionSource,
	IAvailabilityPath,
} from '@/domain/availability/types';
import {
	COLLECTION_POINT_REFRESH_FACTS,
	getCollectionPointReferenceKey,
} from '@/domain/data/places/collectionFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';

const GAME_DAY_START_HOUR = 10;
const GAME_DAY_END_HOUR = 18;
const GAME_DAY_HOURS = GAME_DAY_END_HOUR - GAME_DAY_START_HOUR;
const COLLECT_CHANNEL_BONUS = 1.2;

const COLLECTION_POINT_REFRESH_TIME_MAP = new Map(
	COLLECTION_POINT_REFRESH_FACTS.map((collectionPoint) => [
		getCollectionPointReferenceKey(collectionPoint),
		collectionPoint.refreshTimeHours,
	])
);

export interface IRecommendationPriorityMetrics {
	readonly acquisitionEase: number;
	readonly contentMismatchCount: number;
	readonly guestPlacesMismatchCount: number;
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
	readonly guestDlc: TDlc;
	readonly guestPlaces: ReadonlyArray<TMapLabel>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
}

interface IRecommendationItemAvailability extends IRecommendationAvailabilityContext {
	readonly allowFishingFallback: boolean;
	readonly availabilityPaths: ReadonlyArray<IAvailabilityPath>;
	readonly contentDlc: TDlc;
}

interface ISourcePlaceMetrics {
	readonly guestPlacesMismatchCount: number;
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
		guestPlacesMismatchCount: 0,
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
		left.guestPlacesMismatchCount - right.guestPlacesMismatchCount ||
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
		guestPlacesMismatchCount:
			left.guestPlacesMismatchCount + right.guestPlacesMismatchCount,
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

function getNaturalDlcs(guestDlc: TDlc) {
	return guestDlc === 0 ? new Set<TDlc>([0]) : new Set<TDlc>([0, guestDlc]);
}

function getSourcePlaceMetrics(
	source: IAvailabilityAcquisitionSource,
	guestPlaces: ReadonlyArray<TMapLabel>
): ISourcePlaceMetrics {
	if (source.kind === 'self') {
		return {
			guestPlacesMismatchCount: 0,
			lateSourceCount: 0,
			maxLateTierDistance: 0,
			primaryPlaceMismatchCount: 0,
			totalLateTierDistance: 0,
			unknownSourceCount: 0,
		};
	}

	const [primaryPlace] = guestPlaces;
	if (source.place === null || primaryPlace === undefined) {
		return {
			guestPlacesMismatchCount: 1,
			lateSourceCount: 0,
			maxLateTierDistance: 0,
			primaryPlaceMismatchCount: 1,
			totalLateTierDistance: 0,
			unknownSourceCount: 1,
		};
	}

	const isGuestPlace = guestPlaces.includes(source.place);
	const tierDistance = isGuestPlace
		? 0
		: Math.max(
				0,
				MAP_FACTS[source.place].unlockTier -
					MAP_FACTS[primaryPlace].unlockTier
			);

	return {
		guestPlacesMismatchCount: isGuestPlace ? 0 : 1,
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
		left.guestPlacesMismatchCount - right.guestPlacesMismatchCount ||
		left.unknownSourceCount - right.unknownSourceCount ||
		left.lateSourceCount - right.lateSourceCount ||
		left.maxLateTierDistance - right.maxLateTierDistance ||
		left.totalLateTierDistance - right.totalLateTierDistance
	);
}

function getPathSourcePlaceMetrics(
	path: IAvailabilityPath,
	guestPlaces: ReadonlyArray<TMapLabel>
) {
	let bestMetrics: ISourcePlaceMetrics | null = null;

	for (const source of path.acquisitionSources) {
		const metrics = getSourcePlaceMetrics(source, guestPlaces);
		if (
			bestMetrics === null ||
			compareSourcePlaceMetrics(metrics, bestMetrics) < 0
		) {
			bestMetrics = metrics;
		}
	}

	return (
		bestMetrics ?? {
			guestPlacesMismatchCount: 1,
			lateSourceCount: 0,
			maxLateTierDistance: 0,
			primaryPlaceMismatchCount: 1,
			totalLateTierDistance: 0,
			unknownSourceCount: 1,
		}
	);
}

function getCollectEase(source: IAvailabilityAcquisitionSource) {
	const collectionPoint = getAvailabilityCollectionPointReference(source);
	if (collectionPoint === undefined) {
		return 0;
	}
	const refreshHours = COLLECTION_POINT_REFRESH_TIME_MAP.get(
		getCollectionPointReferenceKey(collectionPoint)
	);
	if (isNil(refreshHours)) {
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
		guestDlc,
		guestPlaces,
	}: Pick<IRecommendationAvailabilityContext, 'guestDlc' | 'guestPlaces'>
): ISelectedRecommendationAvailabilityPath {
	const naturalDlcs = getNaturalDlcs(guestDlc);
	const placeMetrics = getPathSourcePlaceMetrics(path, guestPlaces);

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
	guestDlc,
	guestPlaces,
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
		const selected = createPathMetrics(path, { guestDlc, guestPlaces });
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
	guestDlc,
	guestPlaces,
	hiddenDlcs,
}: IRecommendationItemAvailability): IRecommendationPriorityMetrics | null {
	const selectedPath = selectRecommendationAvailabilityPath({
		allowFishingFallback,
		availabilityPaths,
		guestDlc,
		guestPlaces,
		hiddenDlcs,
	});
	if (selectedPath === null) {
		return null;
	}

	return {
		acquisitionEase: selectedPath.acquisitionEase,
		contentMismatchCount: Number(contentDlc !== guestDlc),
		guestPlacesMismatchCount: selectedPath.guestPlacesMismatchCount,
		lateSourceCount: selectedPath.lateSourceCount,
		maxLateTierDistance: selectedPath.maxLateTierDistance,
		pathMismatchCount: selectedPath.pathMismatchCount,
		primaryPlaceMismatchCount: selectedPath.primaryPlaceMismatchCount,
		totalLateTierDistance: selectedPath.totalLateTierDistance,
		unknownSourceCount: selectedPath.unknownSourceCount,
	};
}
