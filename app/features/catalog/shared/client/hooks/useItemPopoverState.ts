import { useCallback } from 'react';

import { type IDefaultOpenedPopover } from './useOpenedItemPopover';

export function useItemPopoverState(
	defaultOpenedPopover: IDefaultOpenedPopover | null
) {
	const checkDefaultOpen = useCallback(
		(recordId: number) =>
			defaultOpenedPopover !== null &&
			defaultOpenedPopover.recordId === recordId,
		[defaultOpenedPopover]
	);

	const getPopoverKey = useCallback(
		(key: number, recordId: number) =>
			defaultOpenedPopover?.recordId === recordId
				? `${key}:${defaultOpenedPopover.requestId}`
				: key,
		[defaultOpenedPopover]
	);
	const checkShouldEffect = useCallback<(recordId: number) => boolean>(
		() => true,
		[]
	);

	return { checkDefaultOpen, checkShouldEffect, getPopoverKey };
}
