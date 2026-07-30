'use client';

import {
	faChevronLeft,
	faChevronRight,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@heroui/theme';
import { type CSSProperties, memo, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';

import { ANNOUNCEMENT_LEVEL_PRESENTATION } from '@/features/announcements/client/presentation';
import { useAnnouncementCarouselController } from '@/features/announcements/client/useAnnouncementCarouselController';
import { type IAnnouncementPublicItem } from '@/features/announcements/contracts';

import {
	AnnouncementHtml,
	type IAnnouncementMarqueeMetrics,
} from './AnnouncementHtml';

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

export default memo<IProps>(function AnnouncementCarousel({
	serverAnnouncements,
}) {
	const { isHighAppearance } = useDesignPreferences();
	const {
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
	} = useAnnouncementCarouselController(serverAnnouncements);
	const levelMeta =
		visualItem === null
			? null
			: ANNOUNCEMENT_LEVEL_PRESENTATION[visualItem.level];
	const progressStyle = useMemo<IAnnouncementProgressStyle>(
		() => ({
			'--announcement-progress-duration': `${playbackDurationMs}ms`,
		}),
		[playbackDurationMs]
	);
	const progressKey = `${displayedToken ?? 'empty'}:${playbackDurationMs}`;

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
