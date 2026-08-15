export type TTabVisibilityState = 'collapse' | 'expand';

export const tabVisibilityStateMap = {
	collapse: 'collapse',
	expand: 'expand',
} as const satisfies Record<TTabVisibilityState, TTabVisibilityState>;

export function reverseVisibilityState(
	state: TTabVisibilityState
): TTabVisibilityState {
	return state === tabVisibilityStateMap.expand
		? tabVisibilityStateMap.collapse
		: tabVisibilityStateMap.expand;
}
