'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

import {
	type IOverlayShortcutDefinition,
	type TOverlayId,
	getOverlayCoordinatorSnapshot,
	getOverlayPresentationState,
	isOverlayIdleForTutorial,
	isOverlayTaskActive,
	refreshOverlayRegistration,
	registerOverlay,
	shouldSuppressOverlayBackdropBlur,
	subscribeOverlayCoordinator,
	syncOverlayRequested,
} from '@/lib/overlayCoordinator';

interface IOptions {
	canActivate?: (() => boolean) | undefined;
	dismissable?: boolean | undefined;
	exitDelayMs?: number | undefined;
	getRootElement?: (() => HTMLElement | null) | undefined;
	id?: TOverlayId | undefined;
	isOpen: boolean;
	keepOpenWhenCovered?: boolean | undefined;
	onRequestClose?: (() => void) | undefined;
	shortcuts?: ReadonlyArray<IOverlayShortcutDefinition> | undefined;
}

const EMPTY_SHORTCUTS: ReadonlyArray<IOverlayShortcutDefinition> = [];

function useOverlayCoordinatorSnapshot() {
	return useSyncExternalStore(
		subscribeOverlayCoordinator,
		getOverlayCoordinatorSnapshot,
		getOverlayCoordinatorSnapshot
	);
}

export function useCoordinatedOverlay({
	canActivate,
	dismissable = false,
	exitDelayMs,
	getRootElement,
	id,
	isOpen,
	keepOpenWhenCovered = false,
	onRequestClose,
	shortcuts = EMPTY_SHORTCUTS,
}: IOptions) {
	const canActivateRef = useRef(canActivate);
	canActivateRef.current = canActivate;
	const dismissableRef = useRef(dismissable);
	dismissableRef.current = dismissable;
	const getRootElementRef = useRef(getRootElement);
	getRootElementRef.current = getRootElement;
	const onRequestCloseRef = useRef(onRequestClose);
	onRequestCloseRef.current = onRequestClose;
	const shortcutsRef = useRef(shortcuts);
	shortcutsRef.current = shortcuts;

	const snapshot = useOverlayCoordinatorSnapshot();

	useEffect(() => {
		if (id === undefined) {
			return;
		}

		return registerOverlay({
			canActivate: () => canActivateRef.current?.() ?? true,
			dismissable: () => dismissableRef.current,
			getRootElement: () => getRootElementRef.current?.() ?? null,
			id,
			onRequestClose: () => {
				onRequestCloseRef.current?.();
			},
			get shortcuts() {
				return shortcutsRef.current;
			},
			...(exitDelayMs === undefined ? {} : { exitDelayMs }),
		});
	}, [exitDelayMs, id]);

	useEffect(() => {
		if (id === undefined) {
			return;
		}

		syncOverlayRequested(id, isOpen);

		return () => {
			if (isOpen) {
				syncOverlayRequested(id, false);
			}
		};
	}, [id, isOpen]);

	useEffect(() => {
		if (id !== undefined && isOpen) {
			syncOverlayRequested(id, true);
		}
	}, [canActivate, id, isOpen, snapshot]);

	useEffect(() => {
		if (id !== undefined) {
			refreshOverlayRegistration(id);
		}
	}, [canActivate, id]);

	const presentationState =
		id === undefined
			? isOpen
				? ('active' as const)
				: ('closed' as const)
			: getOverlayPresentationState(id);
	const shouldSuppressBackdropBlur =
		id !== undefined && shouldSuppressOverlayBackdropBlur(snapshot, id);

	return {
		isActiveTask: id === undefined ? false : isOverlayTaskActive(id),
		isPresentationOpen:
			isOpen &&
			(presentationState === 'active' ||
				(keepOpenWhenCovered &&
					presentationState === 'covered' &&
					snapshot.activeBlockerId === null &&
					!snapshot.isBlockingTransition &&
					!snapshot.isTutorialActive)),
		presentationState,
		shouldSuppressBackdropBlur,
	};
}

export function useOverlayIdleForTutorial() {
	useOverlayCoordinatorSnapshot();
	return isOverlayIdleForTutorial();
}

export function useIsOverlayTaskActive(id: TOverlayId) {
	useOverlayCoordinatorSnapshot();
	return isOverlayTaskActive(id);
}
