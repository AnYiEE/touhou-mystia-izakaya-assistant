import { tabVisibilityStateMap } from '@/(pages)/customer-shared/constants';
import type { TTabVisibilityState } from '@/(pages)/customer-shared/types';

export function reverseVisibilityState(
	state: TTabVisibilityState
): TTabVisibilityState {
	return state === tabVisibilityStateMap.expand
		? tabVisibilityStateMap.collapse
		: tabVisibilityStateMap.expand;
}
