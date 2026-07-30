'use client';

import { discardRecommendationBridgeLaunchDescriptor } from './client/bridge/launchDescriptor';
import type { IRecommendationClientDependencies } from './contracts';

discardRecommendationBridgeLaunchDescriptor();

export function startRecommendationClient(
	dependencies: IRecommendationClientDependencies
): () => void {
	void dependencies;

	return () => {};
}

export { suggestedMealsUiStore } from './client/state/suggestedMealsUiStore';
