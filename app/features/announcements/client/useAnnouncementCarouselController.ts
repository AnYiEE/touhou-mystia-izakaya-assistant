'use client';

import {
	type FocusEvent as ReactFocusEvent,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import { accountStore } from '@/features/account/client/state/accountStore';
import { type IAnnouncementPublicItem } from '@/features/announcements/contracts';
import { useSiteMaintenance } from '@/features/siteStatus/client/SiteStatusProvider';

import { fetchServiceApi } from '@/infrastructure/http/client/fetchServiceApi';
import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { checkOrderedArrayEqual } from '@/shared/utilities/collections/check';

import { type IAnnouncementMarqueeMetrics } from './components/AnnouncementHtml';
import {
	type IAnnouncementTransition,
	type TAnnouncementTransitionDirection,
	createAnnouncementDismissedCookieAssignment,
	createMaintenanceAnnouncement,
	findAnnouncementByToken,
	prepareMaintenanceAnnouncementExit,
	prepareMaintenanceAnnouncementItems,
	reconcileServerAnnouncements,
	removePendingAnnouncement,
	selectAnnouncementAfterDismissal,
	selectAnnouncementForDirection,
} from './model/carouselState';

export const ANNOUNCEMENT_ROTATE_INTERVAL = 5000;
export const ANNOUNCEMENT_SWITCH_MS = 620;

export function scheduleAnnouncementTimer(
	callback: () => void,
	delayMs: number
) {
	return globalThis.setTimeout(callback, delayMs);
}

export function cancelAnnouncementTimer(
	timer: ReturnType<typeof globalThis.setTimeout>
) {
	globalThis.clearTimeout(timer);
}

interface IDisplayedMarqueeMetrics extends IAnnouncementMarqueeMetrics {
	token: string;
}

export function useAnnouncementCarouselController(
	serverAnnouncements: IAnnouncementPublicItem[]
) {
	const isReducedMotion = useReducedMotion();
	const maintenance = useSiteMaintenance();
	const csrfToken = accountStore.shared.csrfToken.use();
	const accountUser = accountStore.shared.user.use();
	const rootRef = useRef<HTMLElement>(null);
	const lastPointerInteractionAtRef = useRef(0);
	const autoRotateTimerRef = useRef<ReturnType<
		typeof globalThis.setTimeout
	> | null>(null);
	const initialToken = serverAnnouncements[0]?.dismissed_token ?? null;
	const [activeToken, setActiveToken] = useState<string | null>(initialToken);
	const [displayToken, setDisplayToken] = useState<string | null>(
		initialToken
	);
	const [displayedMarqueeMetrics, setDisplayedMarqueeMetrics] =
		useState<IDisplayedMarqueeMetrics | null>(null);
	const [items, setItems] = useState(serverAnnouncements);
	const [isPaused, setIsPaused] = useState(false);
	const [transitionDirection, setTransitionDirection] =
		useState<TAnnouncementTransitionDirection>('next');
	const [transition, setTransition] =
		useState<IAnnouncementTransition | null>(null);
	const itemsRef = useRef(items);
	const activeTokenRef = useRef(activeToken);
	const displayTokenRef = useRef(displayToken);
	const transitionRef = useRef(transition);
	const maintenanceTokenRef = useRef<string | null>(null);
	const pendingRemovalTokenRef = useRef<string | null>(null);
	const serverAnnouncementTokensRef = useRef(
		serverAnnouncements.map((item) => item.dismissed_token)
	);
	itemsRef.current = items;
	activeTokenRef.current = activeToken;
	displayTokenRef.current = displayToken;
	transitionRef.current = transition;

	const itemCount = items.length;
	const displayedItem =
		findAnnouncementByToken(items, displayToken) ?? items[0] ?? null;
	const visualItem = transition?.toItem ?? displayedItem;
	const visualIndex = Math.max(
		0,
		visualItem === null
			? 0
			: items.findIndex(
					(item) =>
						item.dismissed_token === visualItem.dismissed_token
				)
	);
	const displayedToken = displayedItem?.dismissed_token ?? null;
	const isTransitioning = transition !== null;
	const hasVisibleAnnouncement =
		displayedItem !== null && visualItem !== null;
	const shouldShowControls = itemCount > 1;
	const currentMarqueeMetrics =
		displayedMarqueeMetrics?.token === displayedToken
			? displayedMarqueeMetrics
			: null;
	const marqueeDuration =
		currentMarqueeMetrics?.isOverflowing === true
			? currentMarqueeMetrics.totalDurationMs +
				ANNOUNCEMENT_ROTATE_INTERVAL
			: 0;
	const playbackDurationMs = Math.max(
		ANNOUNCEMENT_ROTATE_INTERVAL,
		marqueeDuration
	);
	const maintenanceItem = useMemo(
		() => createMaintenanceAnnouncement(maintenance),
		[maintenance]
	);
	const writeAnnouncementBarOffset = useCallback(
		(rootElement: HTMLElement | null) => {
			const rect = rootElement?.getBoundingClientRect();
			const offset =
				rect === undefined
					? 0
					: Math.max(0, Math.min(rect.bottom, rect.height));

			globalThis.document.documentElement.style.setProperty(
				'--announcement-bar-offset',
				`${offset}px`
			);
		},
		[]
	);

	const clearAutoRotateTimer = useCallback(() => {
		if (autoRotateTimerRef.current === null) {
			return;
		}

		cancelAnnouncementTimer(autoRotateTimerRef.current);
		autoRotateTimerRef.current = null;
	}, []);

	const updateItems = useCallback(
		(
			updater: (
				current: IAnnouncementPublicItem[]
			) => IAnnouncementPublicItem[]
		) => {
			setItems((current) => {
				const next = updater(current);
				itemsRef.current = next;
				return next;
			});
		},
		[]
	);

	const switchAnnouncement = useCallback(
		(direction: TAnnouncementTransitionDirection) => {
			const selection = selectAnnouncementForDirection({
				direction,
				displayToken: displayTokenRef.current,
				items: itemsRef.current,
				pendingRemovalToken: pendingRemovalTokenRef.current,
				transition: transitionRef.current,
			});

			if (selection === null) {
				return;
			}

			clearAutoRotateTimer();
			setTransitionDirection(direction);
			setDisplayToken(selection.sourceToken);
			setActiveToken(selection.nextItem.dismissed_token);
			setTransition(null);
		},
		[clearAutoRotateTimer]
	);

	const switchToNextAnnouncement = useCallback(() => {
		switchAnnouncement('next');
	}, [switchAnnouncement]);

	const finishPendingRemoval = useCallback(() => {
		const pendingRemovalToken = pendingRemovalTokenRef.current;
		if (pendingRemovalToken === null) {
			return;
		}
		pendingRemovalTokenRef.current = null;
		updateItems((current) => {
			const next = removePendingAnnouncement(
				current,
				pendingRemovalToken
			);
			const fallbackToken = next[0]?.dismissed_token ?? null;
			setActiveToken((currentToken) =>
				currentToken === pendingRemovalToken
					? fallbackToken
					: currentToken
			);
			setDisplayToken((currentToken) =>
				currentToken === pendingRemovalToken
					? fallbackToken
					: currentToken
			);
			return next;
		});
	}, [updateItems]);

	useEffect(() => {
		const nextTokens = serverAnnouncements.map(
			(item) => item.dismissed_token
		);
		const previousTokens = serverAnnouncementTokensRef.current;

		if (checkOrderedArrayEqual(nextTokens, previousTokens)) {
			return;
		}

		serverAnnouncementTokensRef.current = nextTokens;

		const reconciliation = reconcileServerAnnouncements({
			activeToken: activeTokenRef.current,
			currentItems: itemsRef.current,
			displayToken: displayTokenRef.current,
			pendingRemovalToken: pendingRemovalTokenRef.current,
			serverAnnouncements,
			transition: transitionRef.current,
		});

		if (
			reconciliation.transitionTargetInvalid ||
			reconciliation.activeTokenInvalid ||
			reconciliation.displayTokenInvalid
		) {
			clearAutoRotateTimer();
		}
		pendingRemovalTokenRef.current = reconciliation.nextPendingRemovalToken;
		updateItems(() => reconciliation.nextItems);

		if (reconciliation.transitionTargetInvalid) {
			setTransition(null);
		}
		if (
			activeTokenRef.current === null ||
			!reconciliation.selectableTokens.has(activeTokenRef.current)
		) {
			setActiveToken(reconciliation.fallbackToken);
		}
		if (
			displayTokenRef.current === null ||
			reconciliation.displayTokenInvalid
		) {
			setDisplayToken(reconciliation.fallbackToken);
		}
	}, [clearAutoRotateTimer, serverAnnouncements, updateItems]);

	useEffect(() => {
		const nextMaintenanceToken = maintenanceItem?.dismissed_token ?? null;
		const previousMaintenanceToken = maintenanceTokenRef.current;

		if (nextMaintenanceToken === previousMaintenanceToken) {
			return;
		}

		maintenanceTokenRef.current = nextMaintenanceToken;

		const currentItems = itemsRef.current;
		const currentVisualItem =
			transitionRef.current?.toItem ??
			findAnnouncementByToken(currentItems, displayTokenRef.current);

		if (maintenanceItem !== null) {
			clearAutoRotateTimer();

			const preparedItems = prepareMaintenanceAnnouncementItems({
				currentItems,
				currentVisualItem,
				maintenanceItem,
				previousMaintenanceToken,
			});
			updateItems(() => preparedItems.nextItems);
			pendingRemovalTokenRef.current = preparedItems.pendingRemovalToken;

			if (currentVisualItem === null) {
				setActiveToken(nextMaintenanceToken);
				setDisplayToken(nextMaintenanceToken);
				setTransition(null);
				return;
			}

			setDisplayToken(currentVisualItem.dismissed_token);
			setTransitionDirection('next');
			setActiveToken(nextMaintenanceToken);
			setTransition(null);

			return;
		}

		const { ordinaryItems, shouldTransitionFromMaintenance } =
			prepareMaintenanceAnnouncementExit({
				currentItems,
				currentVisualItem,
				previousMaintenanceToken,
			});

		if (ordinaryItems.length === 0) {
			updateItems(() => []);
			pendingRemovalTokenRef.current = null;
			setActiveToken(null);
			setDisplayToken(null);
			setTransition(null);
			return;
		}

		if (shouldTransitionFromMaintenance) {
			clearAutoRotateTimer();
			pendingRemovalTokenRef.current = previousMaintenanceToken;
			setDisplayToken(previousMaintenanceToken);
			setTransitionDirection('next');
			setActiveToken(ordinaryItems[0]?.dismissed_token ?? null);
			setTransition(null);
			return;
		}

		updateItems(() => ordinaryItems);
		pendingRemovalTokenRef.current = null;

		if (activeTokenRef.current === previousMaintenanceToken) {
			setActiveToken(
				currentVisualItem?.dismissed_token ??
					ordinaryItems[0]?.dismissed_token ??
					null
			);
		}
	}, [clearAutoRotateTimer, maintenanceItem, updateItems]);

	useEffect(() => {
		if (!hasVisibleAnnouncement) {
			writeAnnouncementBarOffset(null);
			return;
		}

		const rootElement = rootRef.current;
		const updateAnnouncementBarOffset = () => {
			writeAnnouncementBarOffset(rootElement);
		};

		updateAnnouncementBarOffset();
		globalThis.addEventListener('scroll', updateAnnouncementBarOffset, {
			passive: true,
		});
		globalThis.addEventListener('resize', updateAnnouncementBarOffset);

		if (rootElement === null || typeof ResizeObserver === 'undefined') {
			return () => {
				globalThis.removeEventListener(
					'scroll',
					updateAnnouncementBarOffset
				);
				globalThis.removeEventListener(
					'resize',
					updateAnnouncementBarOffset
				);
				writeAnnouncementBarOffset(null);
			};
		}

		// eslint-disable-next-line compat/compat -- Progressive enhancement; a one-time measurement still runs without ResizeObserver.
		const resizeObserver = new ResizeObserver(() => {
			updateAnnouncementBarOffset();
		});
		resizeObserver.observe(rootElement);

		return () => {
			resizeObserver.disconnect();
			globalThis.removeEventListener(
				'scroll',
				updateAnnouncementBarOffset
			);
			globalThis.removeEventListener(
				'resize',
				updateAnnouncementBarOffset
			);
			writeAnnouncementBarOffset(null);
		};
	}, [hasVisibleAnnouncement, writeAnnouncementBarOffset]);

	useEffect(() => {
		setDisplayedMarqueeMetrics(null);
	}, [displayedToken]);

	useEffect(() => {
		if (displayToken === activeToken) {
			setTransition(null);
			finishPendingRemoval();
			return;
		}
		if (displayToken === null || activeToken === null) {
			setDisplayToken(activeToken);
			setTransition(null);
			return;
		}

		const fromItem = findAnnouncementByToken(
			itemsRef.current,
			displayToken
		);
		const toItem = findAnnouncementByToken(itemsRef.current, activeToken);
		if (fromItem === null || toItem === null || isReducedMotion) {
			setDisplayToken(activeToken);
			setTransition(null);
			finishPendingRemoval();
			return;
		}

		const nextTransition: IAnnouncementTransition = {
			direction: transitionDirection,
			fromItem,
			toItem,
		};
		transitionRef.current = nextTransition;
		setTransition(nextTransition);

		const timer = scheduleAnnouncementTimer(() => {
			setDisplayToken(activeToken);
			setTransition(null);
			finishPendingRemoval();
		}, ANNOUNCEMENT_SWITCH_MS);

		return () => {
			cancelAnnouncementTimer(timer);
		};
	}, [
		activeToken,
		displayToken,
		finishPendingRemoval,
		isReducedMotion,
		transitionDirection,
	]);

	useEffect(() => {
		clearAutoRotateTimer();

		if (
			isReducedMotion ||
			isPaused ||
			isTransitioning ||
			itemsRef.current.length <= 1
		) {
			return;
		}

		autoRotateTimerRef.current = scheduleAnnouncementTimer(() => {
			autoRotateTimerRef.current = null;
			switchToNextAnnouncement();
		}, playbackDurationMs);

		return clearAutoRotateTimer;
	}, [
		clearAutoRotateTimer,
		displayedToken,
		isPaused,
		isReducedMotion,
		isTransitioning,
		playbackDurationMs,
		switchToNextAnnouncement,
	]);

	const handleDisplayedMarqueeComplete = useCallback(() => {
		if (
			currentMarqueeMetrics?.isOverflowing !== true ||
			isPaused ||
			isReducedMotion ||
			isTransitioning ||
			itemsRef.current.length <= 1
		) {
			return;
		}

		clearAutoRotateTimer();
		autoRotateTimerRef.current = scheduleAnnouncementTimer(() => {
			autoRotateTimerRef.current = null;
			switchToNextAnnouncement();
		}, ANNOUNCEMENT_ROTATE_INTERVAL);
	}, [
		clearAutoRotateTimer,
		currentMarqueeMetrics?.isOverflowing,
		isPaused,
		isReducedMotion,
		isTransitioning,
		switchToNextAnnouncement,
	]);

	const handleDisplayedMarqueeMetricsChange = useCallback(
		(metrics: IAnnouncementMarqueeMetrics) => {
			if (displayedToken === null) {
				return;
			}

			setDisplayedMarqueeMetrics((current) => {
				if (
					current?.token === displayedToken &&
					current.distance === metrics.distance &&
					current.duration === metrics.duration &&
					current.durationMs === metrics.durationMs &&
					current.isOverflowing === metrics.isOverflowing &&
					current.totalDurationMs === metrics.totalDurationMs
				) {
					return current;
				}

				return { ...metrics, token: displayedToken };
			});
		},
		[displayedToken]
	);

	const handleManualSwitch = useCallback(
		(direction: TAnnouncementTransitionDirection) => {
			switchAnnouncement(direction);
		},
		[switchAnnouncement]
	);

	const writeDismissedCookie = useCallback((token: string) => {
		globalThis.document.cookie =
			createAnnouncementDismissedCookieAssignment({
				cookie: globalThis.document.cookie,
				protocol: globalThis.location.protocol,
				token,
			});
	}, []);

	const handlePrevious = useCallback(() => {
		handleManualSwitch('previous');
	}, [handleManualSwitch]);

	const handleNext = useCallback(() => {
		handleManualSwitch('next');
	}, [handleManualSwitch]);

	const handleDismiss = useCallback(() => {
		if (!visualItem?.dismissible) {
			return;
		}

		const dismissedItem = visualItem;

		clearAutoRotateTimer();
		setIsPaused(false);
		setDisplayedMarqueeMetrics(null);
		writeDismissedCookie(dismissedItem.dismissed_token);

		const selection = selectAnnouncementAfterDismissal({
			dismissedToken: dismissedItem.dismissed_token,
			items: itemsRef.current,
			pendingRemovalToken: pendingRemovalTokenRef.current,
		});

		pendingRemovalTokenRef.current = null;
		updateItems(() => selection.nextItems);
		setActiveToken(selection.nextItem?.dismissed_token ?? null);
		setDisplayToken(selection.nextItem?.dismissed_token ?? null);
		setTransition(null);

		if (accountUser !== null && csrfToken !== null) {
			void fetchServiceApi('/api/v1/announcements', {
				body: JSON.stringify({
					id: dismissedItem.id,
					updatedAt: dismissedItem.updated_at,
				}),
				headers: {
					'Content-Type': FILE_TYPE_JSON,
					'X-CSRF-Token': csrfToken,
				},
				method: 'POST',
			}).catch((error: unknown) => {
				console.warn('dismiss announcement failed', {
					errorCode: getLogSafeErrorCode(error),
				});
			});
		}
	}, [
		accountUser,
		clearAutoRotateTimer,
		csrfToken,
		updateItems,
		visualItem,
		writeDismissedCookie,
	]);

	const markPointerInteraction = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			lastPointerInteractionAtRef.current = Date.now();
			if (event.pointerType !== 'mouse') {
				setIsPaused(false);
			}
		},
		[]
	);

	const handleFocus = useCallback((event: ReactFocusEvent<HTMLElement>) => {
		const targetElement = event.target;
		if (
			Date.now() - lastPointerInteractionAtRef.current < 2000 ||
			!(targetElement instanceof Element) ||
			!targetElement.matches(':focus-visible')
		) {
			return;
		}

		setIsPaused(true);
	}, []);

	const rootHandlers = useMemo(
		() => ({
			onBlur: () => {
				setIsPaused(false);
			},
			onFocus: handleFocus,
			onPointerCancel: markPointerInteraction,
			onPointerDown: markPointerInteraction,
			onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
				if (event.pointerType === 'mouse') {
					setIsPaused(true);
				}
			},
			onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
				if (event.pointerType === 'mouse') {
					setIsPaused(false);
				}
			},
			onPointerUp: markPointerInteraction,
		}),
		[handleFocus, markPointerInteraction]
	);

	return {
		displayedItem,
		displayedToken,
		handleDismiss,
		handleDisplayedMarqueeComplete,
		handleDisplayedMarqueeMetricsChange,
		handleNext,
		handlePrevious,
		isPaused,
		isReducedMotion,
		isTransitioning,
		itemCount,
		playbackDurationMs,
		rootHandlers,
		rootRef,
		shouldShowControls,
		transition,
		visualIndex,
		visualItem,
	};
}
