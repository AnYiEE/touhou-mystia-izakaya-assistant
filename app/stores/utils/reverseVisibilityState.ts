import { tabVisibilityStateMap } from '@/(pages)/customer-rare/constants';
import type { TTabVisibilityState } from '@/(pages)/customer-rare/types';

export function reverseVisibilityState(
	state: TTabVisibilityState
): TTabVisibilityState {
	return state === tabVisibilityStateMap.expand
		? tabVisibilityStateMap.collapse
		: tabVisibilityStateMap.expand;
}
