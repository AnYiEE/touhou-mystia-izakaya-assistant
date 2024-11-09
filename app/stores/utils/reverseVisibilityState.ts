import {TabVisibilityState} from '@/(pages)/customer-rare/constants';

type TTabVisibilityState = keyof typeof TabVisibilityState;

export function reverseVisibilityState(state: TTabVisibilityState) {
	return state === TabVisibilityState.expand ? TabVisibilityState.collapse : TabVisibilityState.expand;
}
