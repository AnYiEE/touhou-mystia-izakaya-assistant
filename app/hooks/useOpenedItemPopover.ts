import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { useParams, usePathname } from '@/hooks';

import { getGlobalSearchSectionFromPathname } from '@/lib/globalSearch';
import { ITEM_SHARE_PARAM_NAME } from '@/lib/itemShare';
import { globalStore as store } from '@/stores';

export interface IDefaultOpenedPopover {
	name: string;
	requestId: number;
	source: 'spotlight' | 'url';
}

export function useOpenedItemPopover(
	popoverCardRef: RefObject<HTMLElement | null>
) {
	const { params, replaceState } = useParams();
	const { pathname } = usePathname();

	const transientTarget = store.shared.globalSearch.transientTarget.use();

	const [defaultOpenedPopover, setDefaultOpenedPopover] =
		useState<IDefaultOpenedPopover | null>(null);

	const handledParamRef = useRef<string | null>(null);
	const requestIdRef = useRef(0);

	const openDefaultPopover = useCallback(
		(name: string, source: IDefaultOpenedPopover['source']) => {
			requestIdRef.current += 1;
			setDefaultOpenedPopover({
				name,
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
		openDefaultPopover(param, 'url');
	}, [openDefaultPopover, params, pathname]);

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

		openDefaultPopover(transientTarget.name, 'spotlight');
		store.setGlobalSearchTransientTarget(null);
	}, [openDefaultPopover, pathname, transientTarget]);

	const setOpenedPopover = useCallback(
		(name: string | null) => {
			const newParams = new URLSearchParams(params);
			if (name === null) {
				newParams.delete(ITEM_SHARE_PARAM_NAME);
			} else {
				newParams.set(ITEM_SHARE_PARAM_NAME, name);
				openDefaultPopover(name, 'url');
			}

			replaceState(newParams);
		},
		[openDefaultPopover, params, replaceState]
	);

	const getPopoverOpenChangeProps = useCallback(
		(name: string) => {
			if (
				defaultOpenedPopover?.source !== 'url' ||
				defaultOpenedPopover.name !== name
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
