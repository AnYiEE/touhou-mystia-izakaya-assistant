import { type TSpecialGuestPlansMessageKey } from '@/features/specialGuestPlans/client/messages';

export const SPECIAL_GUEST_PLAN_RECOMMENDATION_MESSAGE_KEYS = {
	automatic: 'plans.recommended.automatic',
	failed: 'plans.recommended.failed',
	filteredEmpty: 'plans.recommended.filteredEmpty',
	filteredPending: 'plans.recommended.filteredPending',
	loading: 'plans.recommended.loading',
	loadingMore: 'plans.recommended.loadingMore',
	noMatch: 'plans.recommended.noMatch',
	partialFailure: 'plans.recommended.partialFailure',
	pending: 'plans.recommended.pending',
	totalFailure: 'plans.recommended.totalFailure',
} as const satisfies Record<string, TSpecialGuestPlansMessageKey>;
