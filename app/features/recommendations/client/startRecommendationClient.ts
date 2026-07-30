'use client';

import type { IRecommendationClientDependencies } from '@/features/recommendations/contracts';

import { startRecommendationBridgeClient } from './bridge/client';

export function startRecommendationClient({
	accountGate,
}: IRecommendationClientDependencies): () => void {
	return startRecommendationBridgeClient(accountGate);
}
