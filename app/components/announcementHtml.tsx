'use client';

import {
	type CSSProperties,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { cn } from '@/design/ui/components';

import { ANNOUNCEMENT_HTML_CLASS_NAME } from './announcementPresentation';

const ANNOUNCEMENT_MARQUEE_DELAY_MS = 180;
const ANNOUNCEMENT_MARQUEE_END_PADDING_PX = 24;
const ANNOUNCEMENT_MARQUEE_LOOP_GAP_PX = 48;
const ANNOUNCEMENT_MARQUEE_MIN_DURATION_MS = 900;
const ANNOUNCEMENT_MARQUEE_PX_PER_SECOND = 56;

export interface IAnnouncementMarqueeMetrics {
	distance: number;
	duration: string;
	durationMs: number;
	isOverflowing: boolean;
	totalDurationMs: number;
}

interface IAnnouncementMarqueeStyle extends CSSProperties {
	'--announcement-marquee-delay'?: string;
	'--announcement-marquee-distance'?: string;
	'--announcement-marquee-duration'?: string;
	'--announcement-marquee-loop-gap'?: string;
}

interface IAnnouncementHtmlProps {
	className?: string;
	html: string;
	isMarqueeDisabled?: boolean;
	isPaused?: boolean;
	isLooping?: boolean;
	onMarqueeComplete?: () => void;
	onMetricsChange?: (metrics: IAnnouncementMarqueeMetrics) => void;
}

const emptyMarqueeMetrics = {
	distance: 0,
	duration: '0s',
	durationMs: 0,
	isOverflowing: false,
	totalDurationMs: 0,
} as const satisfies IAnnouncementMarqueeMetrics;

export const AnnouncementHtml = memo<IAnnouncementHtmlProps>(
	function AnnouncementHtml({
		className,
		html,
		isLooping,
		isMarqueeDisabled,
		isPaused,
		onMarqueeComplete,
		onMetricsChange,
	}) {
		const contentRef = useRef<HTMLDivElement | null>(null);
		const trackRef = useRef<HTMLDivElement | null>(null);
		const viewportRef = useRef<HTMLDivElement | null>(null);
		const [metrics, setMetrics] =
			useState<IAnnouncementMarqueeMetrics>(emptyMarqueeMetrics);

		useEffect(() => {
			onMetricsChange?.(metrics);
		}, [metrics, onMetricsChange]);

		const handleAnimationEnd = useCallback(() => {
			if (!metrics.isOverflowing || isLooping) {
				return;
			}

			onMarqueeComplete?.();
		}, [isLooping, metrics.isOverflowing, onMarqueeComplete]);

		useEffect(() => {
			if (isMarqueeDisabled) {
				setMetrics(emptyMarqueeMetrics);
				return;
			}

			const contentElement = contentRef.current;
			const trackElement = trackRef.current;
			const viewportElement = viewportRef.current;

			if (
				contentElement === null ||
				trackElement === null ||
				viewportElement === null
			) {
				return;
			}

			setMetrics(emptyMarqueeMetrics);

			let animationFrameId: number | null = null;

			const measureOverflow = () => {
				if (animationFrameId !== null) {
					globalThis.cancelAnimationFrame(animationFrameId);
				}

				animationFrameId = globalThis.requestAnimationFrame(() => {
					const contentRect = contentElement.getBoundingClientRect();
					const viewportRect =
						viewportElement.getBoundingClientRect();
					const contentWidth = Math.max(
						contentElement.scrollWidth,
						contentRect.width
					);
					const viewportWidth = Math.max(
						viewportElement.clientWidth,
						viewportRect.width
					);
					const clippedWidth = Math.max(
						contentElement.scrollWidth -
							viewportElement.clientWidth,
						contentWidth - viewportWidth
					);
					const isOverflowing = clippedWidth > 0;
					const distance = isOverflowing
						? Math.ceil(
								isLooping
									? contentWidth +
											ANNOUNCEMENT_MARQUEE_LOOP_GAP_PX
									: clippedWidth +
											ANNOUNCEMENT_MARQUEE_END_PADDING_PX
							)
						: 0;
					const durationMs = isOverflowing
						? Math.max(
								ANNOUNCEMENT_MARQUEE_MIN_DURATION_MS,
								Math.round(
									(distance /
										ANNOUNCEMENT_MARQUEE_PX_PER_SECOND) *
										1000
								)
							)
						: 0;
					const duration = `${(durationMs / 1000).toFixed(2)}s`;
					const totalDurationMs = isOverflowing
						? durationMs + ANNOUNCEMENT_MARQUEE_DELAY_MS
						: 0;

					setMetrics((currentMetrics) => {
						if (
							currentMetrics.distance === distance &&
							currentMetrics.duration === duration &&
							currentMetrics.durationMs === durationMs &&
							currentMetrics.isOverflowing === isOverflowing &&
							currentMetrics.totalDurationMs === totalDurationMs
						) {
							return currentMetrics;
						}

						return {
							distance,
							duration,
							durationMs,
							isOverflowing,
							totalDurationMs,
						};
					});
				});
			};

			measureOverflow();

			globalThis.addEventListener('resize', measureOverflow);
			void globalThis.document.fonts.ready.then(measureOverflow);
			const resizeObserver =
				typeof ResizeObserver === 'undefined'
					? null
					: // eslint-disable-next-line compat/compat -- Progressive enhancement; resize still works without ResizeObserver.
						new ResizeObserver(measureOverflow);
			resizeObserver?.observe(trackElement);
			resizeObserver?.observe(viewportElement);

			return () => {
				if (animationFrameId !== null) {
					globalThis.cancelAnimationFrame(animationFrameId);
				}
				globalThis.removeEventListener('resize', measureOverflow);
				resizeObserver?.disconnect();
			};
		}, [html, isLooping, isMarqueeDisabled]);

		const marqueeStyle: IAnnouncementMarqueeStyle | undefined =
			metrics.isOverflowing
				? {
						'--announcement-marquee-delay': `${ANNOUNCEMENT_MARQUEE_DELAY_MS}ms`,
						'--announcement-marquee-distance': `${metrics.distance}px`,
						'--announcement-marquee-duration': metrics.duration,
						...(isLooping === true
							? {
									'--announcement-marquee-loop-gap': `${ANNOUNCEMENT_MARQUEE_LOOP_GAP_PX}px`,
								}
							: null),
					}
				: undefined;

		return (
			<div
				ref={viewportRef}
				className={cn(
					'announcement-marquee-viewport min-w-0',
					className
				)}
			>
				<div
					ref={trackRef}
					className={cn(
						'announcement-marquee-track',
						isMarqueeDisabled && 'max-w-full overflow-hidden',
						metrics.isOverflowing &&
							'announcement-marquee-track-running',
						metrics.isOverflowing &&
							isLooping &&
							'announcement-marquee-track-looping',
						metrics.isOverflowing &&
							isPaused &&
							'announcement-marquee-track-paused'
					)}
					onAnimationEnd={handleAnimationEnd}
					style={marqueeStyle}
				>
					<div
						ref={contentRef}
						className={cn(ANNOUNCEMENT_HTML_CLASS_NAME, 'shrink-0')}
						dangerouslySetInnerHTML={{ __html: html }}
					/>
					{metrics.isOverflowing && isLooping ? (
						<div
							aria-hidden
							inert
							className={cn(
								ANNOUNCEMENT_HTML_CLASS_NAME,
								'pointer-events-none shrink-0 select-none'
							)}
							dangerouslySetInnerHTML={{ __html: html }}
						/>
					) : null}
				</div>
			</div>
		);
	}
);
