'use client';

import {
	type CSSProperties,
	type FocusEvent as ReactFocusEvent,
	type PointerEvent as ReactPointerEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronLeft,
	faChevronRight,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { Button, cn } from '@/design/ui/components';
import { useReducedMotion } from '@/design/ui/hooks';

import {
	AnnouncementHtml,
	type IAnnouncementMarqueeMetrics,
} from './announcementHtml';
import { ANNOUNCEMENT_LEVEL_PRESENTATION } from './announcementPresentation';
import {
	ANNOUNCEMENT_DISMISSED_COOKIE_NAME,
	appendAnnouncementDismissalToken,
	parseAnnouncementDismissedCookieValue,
	serializeAnnouncementDismissedCookieTokens,
} from '@/lib/announcements/shared/dismissals';
import { type IAnnouncementPublicItem } from '@/lib/announcements/shared/types';
import { fetchServiceApi } from '@/lib/api/serviceClient';
import { useSiteMaintenance } from '@/lib/siteStatus/client/provider';
import { accountStore, globalStore } from '@/stores';

const ANNOUNCEMENT_ROTATE_INTERVAL = 5000;
const ANNOUNCEMENT_SWITCH_MS = 620;

type TAnnouncementTransitionDirection = 'next' | 'previous';

interface IAnnouncementTransition {
	direction: TAnnouncementTransitionDirection;
	fromItem: IAnnouncementPublicItem;
	toItem: IAnnouncementPublicItem;
}

interface IAnnouncementProgressStyle extends CSSProperties {
	'--announcement-progress-duration'?: string;
}

interface IAnnouncementContentProps {
	className?: string;
	isMarqueeDisabled?: boolean;
	isPaused?: boolean;
	item: IAnnouncementPublicItem;
	isMarqueeLooping?: boolean;
	onMarqueeComplete?: () => void;
	onMarqueeMetricsChange?: (metrics: IAnnouncementMarqueeMetrics) => void;
}

const AnnouncementContent = memo<IAnnouncementContentProps>(
	function AnnouncementContent({
		className,
		isMarqueeDisabled,
		isMarqueeLooping,
		isPaused,
		item,
		onMarqueeComplete,
		onMarqueeMetricsChange,
	}) {
		const itemMeta = ANNOUNCEMENT_LEVEL_PRESENTATION[item.level];

		return (
			<div
				className={cn(
					'flex min-w-0 items-center gap-2.5',
					itemMeta.contentClassName,
					className
				)}
			>
				<span
					className={cn(
						'inline-flex h-5 w-5 shrink-0 items-center justify-center',
						itemMeta.iconClassName
					)}
				>
					<FontAwesomeIcon icon={itemMeta.icon} className="w-3" />
				</span>
				<div className="min-w-0 flex-1 overflow-hidden">
					<AnnouncementHtml
						html={item.html}
						{...(isMarqueeDisabled === undefined
							? null
							: { isMarqueeDisabled })}
						{...(isMarqueeLooping === undefined
							? null
							: { isLooping: isMarqueeLooping })}
						{...(isPaused === undefined ? null : { isPaused })}
						{...(onMarqueeComplete === undefined
							? null
							: { onMarqueeComplete })}
						{...(onMarqueeMetricsChange === undefined
							? null
							: { onMetricsChange: onMarqueeMetricsChange })}
					/>
				</div>
			</div>
		);
	}
);

interface IDisplayedMarqueeMetrics extends IAnnouncementMarqueeMetrics {
	token: string;
}

interface IAnnouncementBackgroundLayerProps {
	animation?: 'in' | 'out';
	item: IAnnouncementPublicItem;
}

const AnnouncementBackgroundLayer = memo<IAnnouncementBackgroundLayerProps>(
	function AnnouncementBackgroundLayer({ animation, item }) {
		const itemMeta = ANNOUNCEMENT_LEVEL_PRESENTATION[item.level];

		return (
			<span
				aria-hidden
				className={cn(
					'pointer-events-none absolute inset-0 z-0',
					animation === 'in' && 'announcement-background-in',
					animation === 'out' && 'announcement-background-out'
				)}
			>
				<span
					className={cn(
						'announcement-flowing-background absolute inset-0',
						itemMeta.backgroundClassName
					)}
				/>
			</span>
		);
	}
);

interface IProps {
	serverAnnouncements: IAnnouncementPublicItem[];
}

const MAINTENANCE_TOKEN_PREFIX = 'maintenance:';

function findItemByToken(
	items: IAnnouncementPublicItem[],
	token: string | null
) {
	return token === null
		? null
		: (items.find((item) => item.dismissed_token === token) ?? null);
}

function checkMaintenanceItem(item: IAnnouncementPublicItem) {
	return item.dismissed_token.startsWith(MAINTENANCE_TOKEN_PREFIX);
}

export default memo<IProps>(function AnnouncementCarousel({
	serverAnnouncements,
}) {
	const isReducedMotion = useReducedMotion();
	const maintenance = useSiteMaintenance();
	const isHighAppearance = globalStore.persistence.highAppearance.use();
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
		findItemByToken(items, displayToken) ?? items[0] ?? null;
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
	const levelMeta =
		visualItem === null
			? null
			: ANNOUNCEMENT_LEVEL_PRESENTATION[visualItem.level];
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
	const progressStyle = useMemo<IAnnouncementProgressStyle>(
		() => ({
			'--announcement-progress-duration': `${playbackDurationMs}ms`,
		}),
		[playbackDurationMs]
	);
	const progressKey = `${displayedToken ?? 'empty'}:${playbackDurationMs}`;
	const maintenanceItem = useMemo<IAnnouncementPublicItem | null>(
		() =>
			maintenance === null
				? null
				: {
						audience: 'all',
						dismissed_token: `${MAINTENANCE_TOKEN_PREFIX}${maintenance.id}`,
						dismissible: false,
						ends_at: maintenance.expires_at,
						html: maintenance.message,
						id: `${MAINTENANCE_TOKEN_PREFIX}${maintenance.id}`,
						level: maintenance.level,
						priority: Number.MAX_SAFE_INTEGER,
						revision: 1,
						starts_at: maintenance.started_at,
						title: '系统维护',
						updated_at: maintenance.started_at,
					},
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

		globalThis.clearTimeout(autoRotateTimerRef.current);
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
			const pendingRemovalToken = pendingRemovalTokenRef.current;
			const navigableItems = itemsRef.current.filter(
				(item) => item.dismissed_token !== pendingRemovalToken
			);

			if (navigableItems.length <= 1) {
				return;
			}

			const sourceToken =
				transitionRef.current?.toItem.dismissed_token ??
				displayTokenRef.current;
			const sourceIndex = navigableItems.findIndex(
				(item) => item.dismissed_token === sourceToken
			);
			const nextIndex =
				sourceIndex === -1
					? direction === 'previous'
						? navigableItems.length - 1
						: 0
					: direction === 'previous'
						? (sourceIndex - 1 + navigableItems.length) %
							navigableItems.length
						: (sourceIndex + 1) % navigableItems.length;
			const nextItem = navigableItems[nextIndex];

			if (nextItem === undefined) {
				return;
			}

			clearAutoRotateTimer();
			setTransitionDirection(direction);
			setDisplayToken(sourceToken);
			setActiveToken(nextItem.dismissed_token);
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
			const next = current.filter(
				(item) => item.dismissed_token !== pendingRemovalToken
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

		if (
			nextTokens.length === previousTokens.length &&
			nextTokens.every((token, index) => token === previousTokens[index])
		) {
			return;
		}

		serverAnnouncementTokensRef.current = nextTokens;

		const maintenanceItems = itemsRef.current.filter(checkMaintenanceItem);
		const pendingRemovalToken = pendingRemovalTokenRef.current;
		let nextItems = [...maintenanceItems, ...serverAnnouncements];
		let selectableTokens = new Set(
			nextItems
				.filter((item) => item.dismissed_token !== pendingRemovalToken)
				.map((item) => item.dismissed_token)
		);
		const currentTransition = transitionRef.current;
		const transitionTargetInvalid =
			currentTransition !== null &&
			!selectableTokens.has(currentTransition.toItem.dismissed_token);
		const pendingDisplayAllowed =
			pendingRemovalToken !== null &&
			currentTransition !== null &&
			!transitionTargetInvalid &&
			currentTransition.fromItem.dismissed_token ===
				pendingRemovalToken &&
			displayTokenRef.current === pendingRemovalToken;
		const activeTokenInvalid =
			activeTokenRef.current !== null &&
			!selectableTokens.has(activeTokenRef.current);
		const displayTokenInvalid =
			displayTokenRef.current !== null &&
			!selectableTokens.has(displayTokenRef.current) &&
			!pendingDisplayAllowed;

		if (
			transitionTargetInvalid ||
			activeTokenInvalid ||
			displayTokenInvalid
		) {
			clearAutoRotateTimer();
		}
		if (transitionTargetInvalid && pendingRemovalToken !== null) {
			pendingRemovalTokenRef.current = null;
			nextItems = nextItems.filter(
				(item) => item.dismissed_token !== pendingRemovalToken
			);
			selectableTokens = new Set(
				nextItems.map((item) => item.dismissed_token)
			);
		}

		const currentVisualToken =
			currentTransition !== null && !transitionTargetInvalid
				? currentTransition.toItem.dismissed_token
				: displayTokenRef.current;
		const fallbackToken =
			(currentVisualToken !== null &&
			selectableTokens.has(currentVisualToken)
				? currentVisualToken
				: nextItems.find((item) =>
						selectableTokens.has(item.dismissed_token)
					)?.dismissed_token) ?? null;

		updateItems(() => nextItems);

		if (transitionTargetInvalid) {
			setTransition(null);
		}
		if (
			activeTokenRef.current === null ||
			!selectableTokens.has(activeTokenRef.current)
		) {
			setActiveToken(fallbackToken);
		}
		if (displayTokenRef.current === null || displayTokenInvalid) {
			setDisplayToken(fallbackToken);
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
			findItemByToken(currentItems, displayTokenRef.current);
		const ordinaryItems = currentItems.filter(
			(item) => !checkMaintenanceItem(item)
		);

		if (maintenanceItem !== null) {
			clearAutoRotateTimer();

			const previousMaintenanceItem =
				previousMaintenanceToken === null
					? null
					: findItemByToken(currentItems, previousMaintenanceToken);
			const keepPreviousMaintenance =
				previousMaintenanceItem !== null &&
				currentVisualItem?.dismissed_token === previousMaintenanceToken;

			updateItems(() => [
				maintenanceItem,
				...(keepPreviousMaintenance ? [previousMaintenanceItem] : []),
				...ordinaryItems,
			]);
			pendingRemovalTokenRef.current = keepPreviousMaintenance
				? previousMaintenanceToken
				: null;

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

		if (ordinaryItems.length === 0) {
			updateItems(() => []);
			pendingRemovalTokenRef.current = null;
			setActiveToken(null);
			setDisplayToken(null);
			setTransition(null);
			return;
		}

		if (
			previousMaintenanceToken !== null &&
			currentVisualItem?.dismissed_token === previousMaintenanceToken
		) {
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

		const fromItem = findItemByToken(itemsRef.current, displayToken);
		const toItem = findItemByToken(itemsRef.current, activeToken);
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

		const timer = globalThis.setTimeout(() => {
			setDisplayToken(activeToken);
			setTransition(null);
			finishPendingRemoval();
		}, ANNOUNCEMENT_SWITCH_MS);

		return () => {
			globalThis.clearTimeout(timer);
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

		autoRotateTimerRef.current = globalThis.setTimeout(() => {
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
		autoRotateTimerRef.current = globalThis.setTimeout(() => {
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
		const cookieValue =
			globalThis.document.cookie
				.split('; ')
				.find((item) =>
					item.startsWith(`${ANNOUNCEMENT_DISMISSED_COOKIE_NAME}=`)
				)
				?.split('=', 2)[1] ?? null;
		const tokens = parseAnnouncementDismissedCookieValue(cookieValue);
		const nextValue = serializeAnnouncementDismissedCookieTokens(
			appendAnnouncementDismissalToken(tokens, token)
		);

		const secureAttribute =
			globalThis.location.protocol === 'https:' ? '; secure' : '';
		globalThis.document.cookie = `${ANNOUNCEMENT_DISMISSED_COOKIE_NAME}=${nextValue}; path=/; max-age=31536000; samesite=lax${secureAttribute}`;
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

		const currentItems = itemsRef.current;
		const dismissedIndex = currentItems.findIndex(
			(item) => item.dismissed_token === dismissedItem.dismissed_token
		);
		const pendingRemovalToken = pendingRemovalTokenRef.current;
		const nextItems = currentItems.filter(
			(item) =>
				item.dismissed_token !== dismissedItem.dismissed_token &&
				item.dismissed_token !== pendingRemovalToken
		);
		const nextItem =
			nextItems[
				Math.min(Math.max(dismissedIndex, 0), nextItems.length - 1)
			] ?? null;

		pendingRemovalTokenRef.current = null;
		updateItems(() => nextItems);
		setActiveToken(nextItem?.dismissed_token ?? null);
		setDisplayToken(nextItem?.dismissed_token ?? null);
		setTransition(null);

		if (accountUser !== null && csrfToken !== null) {
			void fetchServiceApi('/api/v1/announcements', {
				body: JSON.stringify({
					id: dismissedItem.id,
					updatedAt: dismissedItem.updated_at,
				}),
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-Token': csrfToken,
				},
				method: 'POST',
			}).catch((error: unknown) => {
				console.warn('dismiss announcement failed', error);
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

	if (displayedItem === null || visualItem === null || levelMeta === null) {
		return null;
	}

	const shouldTransitionBackground =
		transition !== null &&
		transition.fromItem.level !== transition.toItem.level;
	const slideInClassName =
		transition?.direction === 'previous'
			? 'announcement-slide-in-from-top'
			: 'announcement-slide-in-from-bottom';
	const slideOutClassName =
		transition?.direction === 'previous'
			? 'announcement-slide-out-to-bottom'
			: 'announcement-slide-out-to-top';
	const displayedContentKey = displayedToken ?? 'empty';

	return (
		<section
			ref={rootRef}
			aria-label="站点通知"
			role="region"
			className={cn(
				'relative overflow-hidden transition-colors duration-500 motion-reduce:transition-none',
				levelMeta.rootClassName,
				isHighAppearance && 'backdrop-saturate-125 backdrop-blur-sm'
			)}
		>
			{shouldTransitionBackground ? (
				<>
					<AnnouncementBackgroundLayer
						animation="out"
						item={transition.fromItem}
					/>
					<AnnouncementBackgroundLayer
						animation="in"
						item={transition.toItem}
					/>
				</>
			) : (
				<AnnouncementBackgroundLayer item={visualItem} />
			)}
			<div className="relative z-10 mx-auto flex max-w-7xl items-center gap-2.5 py-1.5 pl-6 pr-4 sm:pr-6 md:pl-10 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl">
				<div
					className="grid min-w-0 flex-1 overflow-hidden"
					{...rootHandlers}
				>
					{transition === null ? (
						<AnnouncementContent
							key={displayedContentKey}
							item={displayedItem}
							className="col-start-1 row-start-1"
							isMarqueeDisabled={isReducedMotion}
							isMarqueeLooping
							isPaused={isPaused}
							onMarqueeComplete={handleDisplayedMarqueeComplete}
							onMarqueeMetricsChange={
								handleDisplayedMarqueeMetricsChange
							}
						/>
					) : (
						<>
							<AnnouncementContent
								item={transition.fromItem}
								isMarqueeDisabled
								className={cn(
									slideOutClassName,
									'col-start-1 row-start-1'
								)}
							/>
							<AnnouncementContent
								item={transition.toItem}
								isMarqueeDisabled
								className={cn(
									slideInClassName,
									'col-start-1 row-start-1'
								)}
							/>
						</>
					)}
				</div>
				{shouldShowControls && (
					<div className="flex shrink-0 items-center gap-1">
						<Button
							isIconOnly
							aria-label="上一条站点通知"
							className={cn(
								'h-7 min-h-7 w-7 min-w-7',
								levelMeta.buttonClassName
							)}
							radius="sm"
							size="sm"
							variant="light"
							onPress={handlePrevious}
						>
							<FontAwesomeIcon
								icon={faChevronLeft}
								className="w-3"
							/>
						</Button>
						<div
							className={cn(
								'relative flex h-7 min-w-9 items-center justify-center',
								levelMeta.counterClassName
							)}
						>
							<span className="text-center text-tiny tabular-nums">
								{visualIndex + 1}/{itemCount}
							</span>
							<span
								aria-hidden
								className="absolute bottom-0 left-1/2 -translate-x-1/2"
							>
								<span className="announcement-progress-track">
									{!isReducedMotion && !isTransitioning && (
										<span
											key={progressKey}
											className={cn(
												'announcement-progress-fill',
												isPaused &&
													'announcement-progress-paused'
											)}
											style={progressStyle}
										/>
									)}
								</span>
							</span>
						</div>
						<Button
							isIconOnly
							aria-label="下一条站点通知"
							className={cn(
								'h-7 min-h-7 w-7 min-w-7',
								levelMeta.buttonClassName
							)}
							radius="sm"
							size="sm"
							variant="light"
							onPress={handleNext}
						>
							<FontAwesomeIcon
								icon={faChevronRight}
								className="w-3"
							/>
						</Button>
					</div>
				)}
				{visualItem.dismissible ? (
					<Button
						isIconOnly
						aria-label="关闭站点通知"
						className={cn(
							'h-7 min-h-7 w-7 min-w-7 shrink-0',
							levelMeta.buttonClassName
						)}
						radius="sm"
						size="sm"
						variant="light"
						onPress={handleDismiss}
					>
						<FontAwesomeIcon icon={faXmark} className="w-3.5" />
					</Button>
				) : (
					<span aria-hidden className="h-7 w-7 shrink-0" />
				)}
			</div>
		</section>
	);
});
