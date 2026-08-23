import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { useParams } from '@/features/appShell/client/navigation/useParams';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { setGlobalSearchTransientTarget } from '@/features/globalSearch/client/commands';
import { globalSearchStore } from '@/features/globalSearch/client/state/store';
import { getGlobalSearchSectionFromPathname } from '@/features/globalSearch/core/context';
import { ITEM_SHARE_PARAM_NAME } from '@/features/itemSharing/contracts';
import { parseItemShareRecord } from '@/features/itemSharing/shareUrl';

export interface IDefaultOpenedPopover {
	recordId: number;
	requestId: number;
	source: 'spotlight' | 'url';
}

interface IItemRecord {
	readonly id: number;
}

export function useOpenedItemPopover(
	popoverCardRef: RefObject<HTMLElement | null>,
	data: ReadonlyArray<IItemRecord>
) {
	const { params, replaceState } = useParams();
	const { pathname } = usePathname();

	const transientTarget = globalSearchStore.transientTarget.use();

	const [defaultOpenedPopover, setDefaultOpenedPopover] =
		useState<IDefaultOpenedPopover | null>(null);

	const handledParamRef = useRef<string | null>(null);
	const requestIdRef = useRef(0);

	const openDefaultPopover = useCallback(
		(recordId: number, source: IDefaultOpenedPopover['source']) => {
			requestIdRef.current += 1;
			setDefaultOpenedPopover({
				recordId,
				requestId: requestIdRef.current,
				source,
			});
		},
		[]
	);

	useEffect(() => {
		const param = params.get(ITEM_SHARE_PARAM_NAME);
		if (param === null) {
			handledParamRef.current = null;
			return;
		}

		const paramKey = `${pathname}:${param}`;
		if (handledParamRef.current === paramKey) {
			return;
		}

		handledParamRef.current = paramKey;
		const recordId = parseItemShareRecord(param);
		if (
			recordId === null ||
			!data.some((record) => record.id === recordId)
		) {
			const newParams = new URLSearchParams(params);
			newParams.delete(ITEM_SHARE_PARAM_NAME);
			replaceState(newParams);
			return;
		}

		openDefaultPopover(recordId, 'url');
	}, [data, openDefaultPopover, params, pathname, replaceState]);

	useEffect(() => {
		if (defaultOpenedPopover === null) {
			return;
		}

		if (popoverCardRef.current !== null) {
			// Some browsers don't support scrollIntoViewOptions
			try {
				popoverCardRef.current.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
				});
			} catch {
				popoverCardRef.current.scrollIntoView();
			}
		}
	}, [defaultOpenedPopover, popoverCardRef]);

	useEffect(() => {
		if (transientTarget === null) {
			return;
		}

		const currentSection = getGlobalSearchSectionFromPathname(pathname);
		if (currentSection !== transientTarget.section) {
			return;
		}

		openDefaultPopover(transientTarget.recordId, 'spotlight');
		setGlobalSearchTransientTarget(null);
	}, [openDefaultPopover, pathname, transientTarget]);

	const setOpenedPopover = useCallback(
		(recordId: number | null) => {
			const newParams = new URLSearchParams(params);
			if (recordId === null) {
				newParams.delete(ITEM_SHARE_PARAM_NAME);
			} else {
				newParams.set(ITEM_SHARE_PARAM_NAME, String(recordId));
				openDefaultPopover(recordId, 'url');
			}

			replaceState(newParams);
		},
		[openDefaultPopover, params, replaceState]
	);

	const getPopoverOpenChangeProps = useCallback(
		(recordId: number) => {
			if (
				defaultOpenedPopover?.source !== 'url' ||
				defaultOpenedPopover.recordId !== recordId
			) {
				return {};
			}

			return {
				onOpenChange: (isOpen: boolean) => {
					if (!isOpen) {
						setOpenedPopover(null);
					}
				},
			};
		},
		[defaultOpenedPopover, setOpenedPopover]
	);

	return {
		defaultOpenedPopover,
		getPopoverOpenChangeProps,
		setOpenedPopover,
	} as const;
}
