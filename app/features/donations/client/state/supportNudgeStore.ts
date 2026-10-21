import '@/infrastructure/state/enableImmerMapSet';

import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';
import {
	SUPPORT_NUDGE_VALUE_THRESHOLD,
	type TSupportValueSource,
	createCatalogDetailValueKey,
	createMealValueDedupeKey,
	getSupportValuePoints,
} from '@/features/donations/client/supportNudgePolicy';
import { getOverlayCoordinatorSnapshot } from '@/features/overlays/client/store';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

const SUPPORT_NUDGE_STORE_VERSION = 1;
const storeName = 'support-nudge';

function readTimestamp(value: unknown) {
	return typeof value === 'number' &&
		Number.isSafeInteger(value) &&
		value >= 0
		? value
		: null;
}

function createInitialState() {
	return {
		countedKeys: new Set(),
		ignoredRecommendationKeys: new Set(),
		pendingSince: null as number | null,
		persistence: { lastShownAt: null as number | null },
		sessionScore: 0,
		suppressUntil: 0,
		visible: false,
	};
}

function normalizeSupportNudgePersistence(value: unknown) {
	const record = isObjectTagRecord(value) ? value : {};

	return { lastShownAt: readTimestamp(record['lastShownAt']) };
}

function normalizeSupportNudgeRemoteState(value: unknown) {
	if (!isObjectTagRecord(value)) {
		return null;
	}
	const persistence = isObjectTagRecord(value['persistence'])
		? value['persistence']
		: null;
	if (persistence === null) {
		return null;
	}

	return {
		persistence: { lastShownAt: readTimestamp(persistence['lastShownAt']) },
	};
}

const state = createInitialState();

export const supportNudgeStore = store(state, {
	middlewares: [
		createStoreSyncMiddleware<typeof state>({
			name: storeName,
			normalizeRemoteState: normalizeSupportNudgeRemoteState,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			storeVersion: SUPPORT_NUDGE_STORE_VERSION,
			watch: ['persistence.lastShownAt'],
		}),
		createPersistMiddleware<typeof state>({
			merge(persistedState, currentState) {
				if (!isObjectTagRecord(persistedState)) {
					return currentState;
				}

				const persisted = persistedState as Partial<typeof state>;
				const persistedPersistence = persisted.persistence;
				if (
					persistedPersistence === undefined ||
					!isObjectTagRecord(persistedPersistence)
				) {
					return { ...currentState, ...persisted };
				}

				return {
					...currentState,
					...persisted,
					persistence: {
						...currentState.persistence,
						...persistedPersistence,
					},
				};
			},
			name: storeName,
			normalize: normalizeSupportNudgePersistence,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof state;
			},
			version: SUPPORT_NUDGE_STORE_VERSION,
		}),
	],
});

function isTutorialActive() {
	return getOverlayCoordinatorSnapshot().isTutorialActive;
}

function addScoredKey(dedupeKey: string, points: number) {
	if (isTutorialActive()) {
		return false;
	}

	let didScore = false;
	const now = Date.now();
	supportNudgeStore.set((previous) => {
		if (previous.countedKeys.has(dedupeKey)) {
			return previous;
		}

		didScore = true;
		const countedKeys = new Set(previous.countedKeys);
		countedKeys.add(dedupeKey);
		const sessionScore = previous.sessionScore + points;

		return {
			...previous,
			countedKeys,
			pendingSince:
				sessionScore >= SUPPORT_NUDGE_VALUE_THRESHOLD &&
				previous.pendingSince === null
					? now
					: previous.pendingSince,
			sessionScore,
		};
	});

	return didScore;
}

function normalizeValueSource(source: TSupportValueSource) {
	return source === 'search-detail' ? 'catalog-detail' : source;
}

function trackSupportValue(source: TSupportValueSource, dedupeKey: string) {
	return addScoredKey(
		`${normalizeValueSource(source)}:${dedupeKey}`,
		getSupportValuePoints(source)
	);
}

export function ignoreSupportRecommendationWorkflow(workflowKey: string) {
	supportNudgeStore.set((previous) => {
		if (previous.ignoredRecommendationKeys.has(workflowKey)) {
			return previous;
		}

		const ignoredRecommendationKeys = new Set(
			previous.ignoredRecommendationKeys
		);
		ignoredRecommendationKeys.add(workflowKey);

		return { ...previous, ignoredRecommendationKeys };
	});
}

export function trackSupportRecommendationResult(workflowKey: string) {
	if (isTutorialActive()) {
		ignoreSupportRecommendationWorkflow(workflowKey);
		return false;
	}
	if (supportNudgeStore.ignoredRecommendationKeys.get().has(workflowKey)) {
		return false;
	}

	return addScoredKey(
		`recommendation:${workflowKey}`,
		getSupportValuePoints('recommendation-result')
	);
}

export function trackSupportMealSave({
	dedupeKey,
	recommendationWorkflowKey,
}: {
	dedupeKey: string;
	recommendationWorkflowKey?: string;
}) {
	if (isTutorialActive()) {
		return false;
	}

	if (recommendationWorkflowKey === undefined) {
		return addScoredKey(
			`save-meal:${dedupeKey}`,
			getSupportValuePoints('save-meal')
		);
	}

	const recommendationKey = `recommendation:${recommendationWorkflowKey}`;
	const saveMealKey = `save-meal:${dedupeKey}`;
	let didScore = false;
	const now = Date.now();
	supportNudgeStore.set((previous) => {
		if (
			previous.countedKeys.has(recommendationKey) ||
			previous.countedKeys.has(saveMealKey)
		) {
			return previous;
		}

		didScore = true;
		const countedKeys = new Set(previous.countedKeys);
		countedKeys.add(recommendationKey);
		countedKeys.add(saveMealKey);
		const sessionScore =
			previous.sessionScore + getSupportValuePoints('save-meal');

		return {
			...previous,
			countedKeys,
			pendingSince:
				sessionScore >= SUPPORT_NUDGE_VALUE_THRESHOLD &&
				previous.pendingSince === null
					? now
					: previous.pendingSince,
			sessionScore,
		};
	});

	return didScore;
}

export function trackSupportGuestInfo(
	kind: 'normal' | 'special',
	guestId: number
) {
	return trackSupportValue('guest-info', `${kind}:${guestId}`);
}

export function trackSupportCatalogDetail(section: string, recordId: number) {
	return trackSupportValue(
		'catalog-detail',
		createCatalogDetailValueKey({ recordId, section })
	);
}

export function trackSupportSearchDetail(section: string, recordId: number) {
	return trackSupportValue(
		'search-detail',
		createCatalogDetailValueKey({ recordId, section })
	);
}

export function trackSupportMapDetail(map: string, entityId: string) {
	return trackSupportValue('map-detail', `${map}:${entityId}`);
}

export function trackSupportMealRating({
	beverageId,
	beverageTag,
	foodTag,
	guestId,
	hasMystiaCooker,
	ingredientIds,
	isDarkMatter,
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
	return trackSupportValue(
		'meal-rating',
		createMealValueDedupeKey({
			...(beverageTag === undefined ? {} : { beverageTag }),
			beverageId,
			...(foodTag === undefined ? {} : { foodTag }),
			guestId,
			...(hasMystiaCooker === undefined ? {} : { hasMystiaCooker }),
			ingredientIds,
			...(isDarkMatter === undefined ? {} : { isDarkMatter }),
			kind,
			recipeId,
		})
	);
}

export function trackSupportPictureInPicture(
	kind: 'normal' | 'special',
	guestId: number
) {
	return trackSupportValue('picture-in-picture', `${kind}:${guestId}`);
}

export function trackSupportPlanDetail(planId: string) {
	return trackSupportValue('plan-detail', planId);
}

export function trackSupportPlanSave(planId: string) {
	return trackSupportValue('save-plan', planId);
}

export function trackSupportShareSuccess(actionKey = Date.now().toString()) {
	return trackSupportValue('share', actionKey);
}

export function dismissSupportNudge() {
	supportNudgeStore.set((previous) => ({ ...previous, visible: false }));
}

export function discardPendingSupportNudge() {
	supportNudgeStore.set((previous) => ({ ...previous, pendingSince: null }));
}

export function resetSupportNudgeValueProgress() {
	supportNudgeStore.set((previous) => ({
		...previous,
		pendingSince: null,
		sessionScore: 0,
	}));
}

export function markSupportNudgeShown(now = Date.now()) {
	supportNudgeStore.set((previous) => ({
		...previous,
		pendingSince: null,
		persistence: { lastShownAt: now },
		sessionScore: 0,
		visible: true,
	}));
}

export function suppressSupportNudgeUntil(timestamp: number) {
	supportNudgeStore.set((previous) => ({
		...previous,
		pendingSince: null,
		suppressUntil: Math.max(previous.suppressUntil, timestamp),
	}));
}
