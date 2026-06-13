'use client';

import {
	type CSSProperties,
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
import { accountStore, globalStore } from '@/stores';

const ANNOUNCEMENT_ROTATE_INTERVAL = 5000;
const ANNOUNCEMENT_SWITCH_MS = 620;

type TAnnouncementTransitionDirection = 'next' | 'previous';

interface IAnnouncementTransitionIndexes {
	direction: TAnnouncementTransitionDirection;
	fromIndex: number;
	toIndex: number;
}

interface IAnnouncementProgressStyle extends CSSProperties {
	'--announcement-progress-duration'?: string;
}

interface IAnnouncementContentProps {
	className?: string;
	isPaused?: boolean;
	item: IAnnouncementPublicItem;
	isMarqueeLooping?: boolean;
	onMarqueeComplete?: () => void;
	onMarqueeMetricsChange?: (metrics: IAnnouncementMarqueeMetrics) => void;
}

const AnnouncementContent = memo<IAnnouncementContentProps>(
	function AnnouncementContent({
		className,
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
	announcements: IAnnouncementPublicItem[];
}

export default memo<IProps>(function AnnouncementCarousel({ announcements }) {
	const isReducedMotion = useReducedMotion();
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const csrfToken = accountStore.shared.csrfToken.use();
	const accountUser = accountStore.shared.user.use();
	const rootRef = useRef<HTMLElement>(null);
	const autoRotateTimerRef = useRef<ReturnType<
		typeof globalThis.setTimeout
	> | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const [displayIndex, setDisplayIndex] = useState(0);
	const [displayedMarqueeMetrics, setDisplayedMarqueeMetrics] =
		useState<IDisplayedMarqueeMetrics | null>(null);
	const [items, setItems] = useState(announcements);
	const [isPaused, setIsPaused] = useState(false);
	const [transitionDirection, setTransitionDirection] =
		useState<TAnnouncementTransitionDirection>('next');
	const [transitionIndexes, setTransitionIndexes] =
		useState<IAnnouncementTransitionIndexes | null>(null);

	const itemCount = items.length;
	const displayedItem = items[displayIndex] ?? items[0] ?? null;
	const transitionFromItem =
		transitionIndexes === null
			? null
			: (items[transitionIndexes.fromIndex] ?? null);
	const transitionToItem =
		transitionIndexes === null
			? null
			: (items[transitionIndexes.toIndex] ?? null);
	const visualIndex = transitionIndexes?.toIndex ?? displayIndex;
	const visualItem = transitionToItem ?? displayedItem;
	const levelMeta =
		visualItem === null
			? null
			: ANNOUNCEMENT_LEVEL_PRESENTATION[visualItem.level];
	const displayedToken = displayedItem?.dismissed_token ?? null;
	const isTransitioning =
		transitionIndexes !== null &&
		transitionFromItem !== null &&
		transitionToItem !== null;
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
	const progressKey = `${displayedToken ?? 'empty'}:${displayIndex}:${playbackDurationMs}`;
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

	const switchToNextAnnouncement = useCallback(() => {
		if (itemCount <= 1) {
			return;
		}

		clearAutoRotateTimer();
		setTransitionDirection('next');
		setActiveIndex((displayIndex + 1) % itemCount);
	}, [clearAutoRotateTimer, displayIndex, itemCount]);

	useEffect(() => {
		setItems(announcements);
		setActiveIndex(0);
		setDisplayIndex(0);
		setDisplayedMarqueeMetrics(null);
		setTransitionIndexes(null);
	}, [announcements]);

	useEffect(() => {
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
	}, [itemCount, writeAnnouncementBarOffset]);

	useEffect(() => {
		setDisplayedMarqueeMetrics(null);
	}, [displayedToken]);

	useEffect(() => {
		if (itemCount === 0) {
			setActiveIndex(0);
			setDisplayIndex(0);
			setTransitionIndexes(null);
			return;
		}

		setActiveIndex((current) => Math.min(current, itemCount - 1));
		setDisplayIndex((current) => Math.min(current, itemCount - 1));
	}, [itemCount]);

	useEffect(() => {
		if (displayIndex === activeIndex) {
			setTransitionIndexes(null);
			return;
		}
		if (isReducedMotion) {
			setDisplayIndex(activeIndex);
			setTransitionIndexes(null);
			return;
		}

		const nextIndex = Math.min(activeIndex, itemCount - 1);
		const previousIndex = Math.min(displayIndex, itemCount - 1);

		setTransitionIndexes({
			direction: transitionDirection,
			fromIndex: previousIndex,
			toIndex: nextIndex,
		});

		const timer = globalThis.setTimeout(() => {
			setDisplayIndex(nextIndex);
			setTransitionIndexes(null);
		}, ANNOUNCEMENT_SWITCH_MS);

		return () => {
			globalThis.clearTimeout(timer);
		};
	}, [
		activeIndex,
		displayIndex,
		isReducedMotion,
		itemCount,
		transitionDirection,
	]);

	useEffect(() => {
		clearAutoRotateTimer();

		if (isReducedMotion || isPaused || isTransitioning || itemCount <= 1) {
			return;
		}

		autoRotateTimerRef.current = globalThis.setTimeout(() => {
			autoRotateTimerRef.current = null;
			switchToNextAnnouncement();
		}, playbackDurationMs);

		return clearAutoRotateTimer;
	}, [
		clearAutoRotateTimer,
		isPaused,
		isReducedMotion,
		isTransitioning,
		itemCount,
		playbackDurationMs,
		switchToNextAnnouncement,
	]);

	const handleDisplayedMarqueeComplete = useCallback(() => {
		if (
			currentMarqueeMetrics?.isOverflowing !== true ||
			isPaused ||
			isReducedMotion ||
			isTransitioning ||
			itemCount <= 1
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
		itemCount,
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
			if (itemCount <= 1) {
				return;
			}

			clearAutoRotateTimer();
			setIsPaused(true);
			setTransitionDirection(direction);

			const sourceIndex = transitionIndexes?.toIndex ?? displayIndex;
			const nextIndex =
				direction === 'previous'
					? (sourceIndex - 1 + itemCount) % itemCount
					: (sourceIndex + 1) % itemCount;

			setDisplayIndex(sourceIndex);
			setActiveIndex(nextIndex);
			setTransitionIndexes(null);
		},
		[clearAutoRotateTimer, displayIndex, itemCount, transitionIndexes]
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
		writeDismissedCookie(dismissedItem.dismissed_token);
		setItems((currentItems) => {
			const nextItems = currentItems.filter(
				(item) => item.dismissed_token !== dismissedItem.dismissed_token
			);
			setActiveIndex((current) =>
				nextItems.length === 0
					? 0
					: Math.min(current, nextItems.length - 1)
			);
			setDisplayIndex((current) =>
				nextItems.length === 0
					? 0
					: Math.min(current, nextItems.length - 1)
			);
			setTransitionIndexes(null);

			return nextItems;
		});

		if (accountUser !== null && csrfToken !== null) {
			void import('./announcementActions')
				.then(({ dismissAnnouncementAction }) =>
					dismissAnnouncementAction(
						{
							id: dismissedItem.id,
							updatedAt: dismissedItem.updated_at,
						},
						csrfToken
					)
				)
				.then((result) => {
					if (result.status === 'error') {
						console.warn(
							'dismiss announcement failed',
							result.message
						);
					}
				})
				.catch((error: unknown) => {
					console.warn('dismiss announcement failed', error);
				});
		}
	}, [accountUser, csrfToken, visualItem, writeDismissedCookie]);

	const rootHandlers = useMemo(
		() => ({
			onBlur: () => {
				setIsPaused(false);
			},
			onFocus: () => {
				setIsPaused(true);
			},
			onMouseEnter: () => {
				setIsPaused(true);
			},
			onMouseLeave: () => {
				setIsPaused(false);
			},
		}),
		[]
	);

	if (displayedItem === null || visualItem === null || levelMeta === null) {
		return null;
	}

	const shouldTransitionBackground =
		isTransitioning && transitionFromItem.level !== transitionToItem.level;
	const slideInClassName =
		transitionIndexes?.direction === 'previous'
			? 'announcement-slide-in-from-top'
			: 'announcement-slide-in-from-bottom';
	const slideOutClassName =
		transitionIndexes?.direction === 'previous'
			? 'announcement-slide-out-to-bottom'
			: 'announcement-slide-out-to-top';

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
			{...rootHandlers}
		>
			{shouldTransitionBackground ? (
				<>
					<AnnouncementBackgroundLayer
						animation="out"
						item={transitionFromItem}
					/>
					<AnnouncementBackgroundLayer
						animation="in"
						item={transitionToItem}
					/>
				</>
			) : (
				<AnnouncementBackgroundLayer item={visualItem} />
			)}
			<div className="relative z-10 mx-auto flex max-w-7xl items-center gap-2.5 py-1.5 pl-6 pr-4 sm:pr-6 md:pl-10 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl">
				<div className="grid min-w-0 flex-1 overflow-hidden">
					{isTransitioning ? (
						<>
							<AnnouncementContent
								item={transitionFromItem}
								className={cn(
									slideOutClassName,
									'col-start-1 row-start-1'
								)}
							/>
							<AnnouncementContent
								item={transitionToItem}
								className={cn(
									slideInClassName,
									'col-start-1 row-start-1'
								)}
							/>
						</>
					) : (
						<AnnouncementContent
							item={displayedItem}
							className="col-start-1 row-start-1"
							isMarqueeLooping={itemCount === 1}
							isPaused={isPaused}
							onMarqueeComplete={handleDisplayedMarqueeComplete}
							onMarqueeMetricsChange={
								handleDisplayedMarqueeMetricsChange
							}
						/>
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
