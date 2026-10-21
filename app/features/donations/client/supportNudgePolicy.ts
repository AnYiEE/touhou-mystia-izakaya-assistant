export type TSupportValueSource =
	| 'catalog-detail'
	| 'guest-info'
	| 'map-detail'
	| 'meal-rating'
	| 'picture-in-picture'
	| 'plan-detail'
	| 'recommendation-result'
	| 'save-meal'
	| 'save-plan'
	| 'search-detail'
	| 'share';

export const SUPPORT_NUDGE_VALUE_THRESHOLD = 10;
export const SUPPORT_NUDGE_INTERVAL_MS = 10 * 60 * 1000;
export const SUPPORT_NUDGE_PENDING_TTL_MS = 10 * 60 * 1000;
export const SUPPORT_NUDGE_TIMEOUT_MS = 10 * 1000;
export const SUPPORT_RECOMMENDATION_DWELL_MS = 5 * 1000;
export const SUPPORT_PLAN_DETAIL_DWELL_MS = 1000;
export const SUPPORT_MILESTONE_NUDGE_SUPPRESSION_MS = 10 * 60 * 1000;

const SUPPORT_VALUE_POINTS = {
	'catalog-detail': 3,
	'guest-info': 2,
	'map-detail': 1,
	'meal-rating': 2,
	'picture-in-picture': 4,
	'plan-detail': 3,
	'recommendation-result': 3,
	'save-meal': 2,
	'save-plan': 2,
	'search-detail': 3,
	share: 2,
} as const satisfies Record<TSupportValueSource, number>;

export function getSupportValuePoints(source: TSupportValueSource) {
	return SUPPORT_VALUE_POINTS[source];
}

export function shouldShowSupportNudge({
	lastShownAt,
	now = Date.now(),
	sessionScore,
}: {
	lastShownAt: number | null;
	now?: number;
	sessionScore: number;
}) {
	return (
		sessionScore >= SUPPORT_NUDGE_VALUE_THRESHOLD &&
		(lastShownAt === null || now - lastShownAt >= SUPPORT_NUDGE_INTERVAL_MS)
	);
}

export function createSpecialGuestRecommendationWorkflowKey({
	beverageTag,
	foodTag,
	hasMystiaCooker,
	specialGuest,
}: {
	beverageTag: null | number;
	foodTag: null | number;
	hasMystiaCooker: boolean;
	specialGuest: number;
}) {
	return [
		specialGuest,
		foodTag ?? '',
		beverageTag ?? '',
		hasMystiaCooker ? '1' : '0',
	].join(':');
}

export function createMealValueDedupeKey({
	beverageId,
	beverageTag,
	foodTag,
	guestId,
	hasMystiaCooker = false,
	ingredientIds,
	isDarkMatter = false,
	kind,
	recipeId,
}: {
	beverageTag?: null | number;
	beverageId: null | number;
	foodTag?: null | number;
	guestId: number;
	hasMystiaCooker?: boolean;
	ingredientIds: ReadonlyArray<number>;
	isDarkMatter?: boolean;
	kind: 'normal' | 'special';
	recipeId: number;
}) {
	return [
		kind,
		guestId,
		recipeId,
		beverageId ?? '',
		[...ingredientIds].sort((left, right) => left - right).join(','),
		hasMystiaCooker ? '1' : '0',
		isDarkMatter ? '1' : '0',
		foodTag ?? '',
		beverageTag ?? '',
	].join(':');
}

export function createCatalogDetailValueKey({
	recordId,
	section,
}: {
	recordId: number;
	section: string;
}) {
	const normalizedSection = section
		.replace(/^\/+/u, '')
		.replace(/\/+$/u, '')
		.replace(/^currency-items$/u, 'currencies');

	return `${normalizedSection}:${recordId}`;
}
