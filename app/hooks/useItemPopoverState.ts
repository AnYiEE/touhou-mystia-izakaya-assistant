import { useCallback } from 'react';

import { type IDefaultOpenedPopover } from '@/hooks/useOpenedItemPopover';

import { type TItemName } from '@/data';

export function useItemPopoverState(
	defaultOpenedPopover: IDefaultOpenedPopover | null
) {
	const checkDefaultOpen = useCallback(
		(name: TItemName) =>
			defaultOpenedPopover !== null && defaultOpenedPopover.name === name,
		[defaultOpenedPopover]
	);

	const getPopoverKey = useCallback(
		(key: number, name: TItemName) =>
			defaultOpenedPopover?.name === name
				? `${key}:${defaultOpenedPopover.requestId}`
				: key,
		[defaultOpenedPopover]
	);
	const checkShouldEffect = useCallback<(name: TItemName) => boolean>(
		() => true,
		[]
	);

	return { checkDefaultOpen, checkShouldEffect, getPopoverKey };
}
