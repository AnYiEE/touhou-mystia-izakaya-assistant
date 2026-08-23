'use client';

import { safeStorage } from '@/infrastructure/browser/storage/safeStorage';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { deleteCurrentRecommendationCacheDatabase } from './database';

const RECOMMENDATION_CACHE_CLEAR_WAIT_MS = 500;

function waitForClearDeadline() {
	return new Promise<'timeout'>((resolve) => {
		setTimeout(() => {
			resolve('timeout');
		}, RECOMMENDATION_CACHE_CLEAR_WAIT_MS);
	});
}

export async function clearSavedLocalDataBeforeReload() {
	try {
		safeStorage.clear();
	} catch (error) {
		console.warn('Saved storage clear failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}

	try {
		await Promise.race([
			deleteCurrentRecommendationCacheDatabase(),
			waitForClearDeadline(),
		]);
	} catch (error) {
		console.warn('Recommendation cache clear failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}
