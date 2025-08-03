import { useCallback } from 'react';

import { type TItemName } from '@/data';

export function useItemPopoverState(openedPopover: string | null) {
	const checkDefaultOpen = useCallback(
		(name: TItemName) =>
			openedPopover
				? openedPopover === name
				: (undefined as unknown as boolean),
		[openedPopover]
	);

	const checkShouldEffect = useCallback(
		(name: TItemName) => (openedPopover ? openedPopover === name : true),
		[openedPopover]
	);

	return { checkDefaultOpen, checkShouldEffect };
}
