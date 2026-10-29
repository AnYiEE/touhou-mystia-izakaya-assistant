'use client';

import { faExpand, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@heroui/theme';
import {
	type ReactNode,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import {
	type TViewportNavigationAction,
	useViewportNavigation,
} from '@/design/ui/hooks/useViewportNavigation';
import {
	DEFAULT_VIEWPORT_NAVIGATION_CONFIG,
	type IViewportNavigationConfig,
} from '@/design/ui/hooks/viewportNavigationConfig';

import { mapsMessages } from '@/features/maps/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

export interface IMapView {
	height: number;
	width: number;
	/** @description Screen offset of the content origin. */
	x: number;
	y: number;
	/** @description Screen pixels per content pixel. */
	zoom: number;
}

export interface IMapFocusRequest {
	/** @description Changes whenever a new focus is requested. */
	key: number;
	/** @description Zoom in to at least this level; never zooms out. */
	minZoom?: number;
	x: number;
	y: number;
}

interface IProps {
	children: (view: IMapView) => ReactNode;
	className?: string;
	contentHeight: number;
	contentWidth: number;
	focusRequest: IMapFocusRequest | null;
	isPreviewAccessHintVisible?: boolean;
	maxZoom: number;
	/** @description Lower bound for the fitted zoom used initially and by the fit button. */
	minFitZoom?: number;
	navigationConfig?: Partial<IViewportNavigationConfig>;
	/** @description Called when the empty map area is clicked. */
	onBackgroundPress?: () => void;
	onPreviewResolutionLimitReached?: () => void;
	overlay?: ReactNode;
	previewResolutionZoomLimit?: number;
	/** @description Changing it refits the content into the viewport. */
	resetKey: string;
	/**
	 * @description Checked when a press starts; `true` keeps that press from
	 * reaching `onBackgroundPress`, e.g. while it only dismisses a popover.
	 */
	shouldIgnoreBackgroundPress?: () => boolean;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function easeOutCubic(progress: number) {
	return 1 - (1 - progress) ** 3;
}

const PREVIEW_HINT_MIN_ZOOM_RATIO = 0.03;

export default memo<IProps>(function MapViewport({
	children,
	className,
	contentHeight,
	contentWidth,
	focusRequest,
	isPreviewAccessHintVisible,
	maxZoom,
	minFitZoom,
	navigationConfig,
	onBackgroundPress,
	onPreviewResolutionLimitReached,
	overlay,
	previewResolutionZoomLimit,
	resetKey,
	shouldIgnoreBackgroundPress,
}) {
	const { t } = useI18n(mapsMessages);
	const isReducedMotion = useReducedMotion();
	const resolvedNavigationConfig = useMemo(
		() => ({ ...DEFAULT_VIEWPORT_NAVIGATION_CONFIG, ...navigationConfig }),
		[navigationConfig]
	);
	const { focusDurationMs, minZoomFitRatio } = resolvedNavigationConfig;

	const containerRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<IMapView>({
		height: 0,
		width: 0,
		x: 0,
		y: 0,
		zoom: 1,
	});
	const viewRef = useRef(view);
	/** @description `resetKey` the current view was fitted for; children wait until it matches. */
	const [fittedKey, setFittedKey] = useState<string | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	/** @description Allows one hint until the map returns to the preview resolution range. */
	const isPreviewResolutionHintArmedRef = useRef(true);
	/** @description Zoom where the current preview-range increase began. */
	const previewResolutionHintAnchorRef = useRef<number | null>(null);

	/** @description Zoom limits for a viewport size; the content may shrink to 80% of the fitted size. */
	const getZoomLimits = useCallback(
		(width: number, height: number) => {
			const fitZoom =
				width === 0 || height === 0
					? 1
					: Math.min(width / contentWidth, height / contentHeight);
			const minZoom = fitZoom * minZoomFitRatio;
			return { maxZoom: Math.max(maxZoom, minZoom), minZoom };
		},
		[contentHeight, contentWidth, maxZoom, minZoomFitRatio]
	);

	const commit = useCallback(
		(next: IMapView) => {
			const limits = getZoomLimits(next.width, next.height);
			const zoom = clamp(next.zoom, limits.minZoom, limits.maxZoom);
			const scaledWidth = contentWidth * zoom;
			const scaledHeight = contentHeight * zoom;
			// Keep the viewport centre inside the content so it cannot be lost.
			const x = clamp(
				next.x,
				next.width / 2 - scaledWidth,
				next.width / 2
			);
			const y = clamp(
				next.y,
				next.height / 2 - scaledHeight,
				next.height / 2
			);
			const { current } = viewRef;
			if (
				current.height === next.height &&
				current.width === next.width &&
				current.x === x &&
				current.y === y &&
				current.zoom === zoom
			) {
				return;
			}
			const clamped = { ...next, x, y, zoom };
			viewRef.current = clamped;
			setView(clamped);
		},
		[contentHeight, contentWidth, getZoomLimits]
	);

	const notifyPreviewResolutionLimit = useCallback(
		(nextZoom: number, currentZoom: number) => {
			if (previewResolutionZoomLimit === undefined) {
				return;
			}
			if (nextZoom <= previewResolutionZoomLimit) {
				isPreviewResolutionHintArmedRef.current = true;
				previewResolutionHintAnchorRef.current = null;
				return;
			}
			if (isPreviewAccessHintVisible) {
				isPreviewResolutionHintArmedRef.current = false;
				previewResolutionHintAnchorRef.current = null;
				return;
			}
			if (
				!isPreviewResolutionHintArmedRef.current ||
				currentZoom <= 0 ||
				nextZoom <= currentZoom
			) {
				return;
			}
			if (nextZoom <= currentZoom) {
				previewResolutionHintAnchorRef.current = null;
				return;
			}
			const anchorZoom =
				previewResolutionHintAnchorRef.current ?? currentZoom;
			previewResolutionHintAnchorRef.current = anchorZoom;
			if (nextZoom / anchorZoom < 1 + PREVIEW_HINT_MIN_ZOOM_RATIO) {
				return;
			}
			isPreviewResolutionHintArmedRef.current = false;
			previewResolutionHintAnchorRef.current = null;
			onPreviewResolutionLimitReached?.();
		},
		[
			isPreviewAccessHintVisible,
			onPreviewResolutionLimitReached,
			previewResolutionZoomLimit,
		]
	);

	useEffect(() => {
		isPreviewResolutionHintArmedRef.current = true;
		previewResolutionHintAnchorRef.current = null;
	}, [previewResolutionZoomLimit, resetKey]);

	useEffect(() => {
		if (
			isPreviewAccessHintVisible &&
			previewResolutionZoomLimit !== undefined &&
			viewRef.current.zoom > previewResolutionZoomLimit
		) {
			isPreviewResolutionHintArmedRef.current = false;
			previewResolutionHintAnchorRef.current = null;
		}
	}, [isPreviewAccessHintVisible, previewResolutionZoomLimit]);

	const cancelAnimation = useCallback(() => {
		if (animationFrameRef.current !== null) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	}, []);

	const animateTo = useCallback(
		(target: Pick<IMapView, 'x' | 'y' | 'zoom'>) => {
			cancelAnimation();
			if (
				previewResolutionZoomLimit !== undefined &&
				target.zoom <= previewResolutionZoomLimit
			) {
				isPreviewResolutionHintArmedRef.current = true;
			}
			const { current: from } = viewRef;
			if (isReducedMotion) {
				commit({ ...from, ...target });
				return;
			}
			const startTime = performance.now();
			const step = (now: number) => {
				const progress = easeOutCubic(
					Math.min(1, (now - startTime) / focusDurationMs)
				);
				commit({
					...from,
					x: from.x + (target.x - from.x) * progress,
					y: from.y + (target.y - from.y) * progress,
					zoom: from.zoom + (target.zoom - from.zoom) * progress,
				});
				animationFrameRef.current =
					progress < 1 ? requestAnimationFrame(step) : null;
			};
			animationFrameRef.current = requestAnimationFrame(step);
		},
		[
			cancelAnimation,
			commit,
			focusDurationMs,
			isReducedMotion,
			previewResolutionZoomLimit,
		]
	);

	/** @description Zooms while the content point under the anchor stays under it. */
	const animateZoomAt = useCallback(
		(
			screenX: number,
			screenY: number,
			nextZoom: number,
			durationMs = focusDurationMs
		) => {
			cancelAnimation();
			const { current: from } = viewRef;
			const limits = getZoomLimits(from.width, from.height);
			const targetZoom = clamp(nextZoom, limits.minZoom, limits.maxZoom);
			if (targetZoom === from.zoom) {
				return;
			}
			notifyPreviewResolutionLimit(targetZoom, from.zoom);
			const contentX = (screenX - from.x) / from.zoom;
			const contentY = (screenY - from.y) / from.zoom;
			const apply = (zoom: number) => {
				// The viewport may resize mid-animation; keep its latest size.
				const { current } = viewRef;
				commit({
					...current,
					x: screenX - contentX * zoom,
					y: screenY - contentY * zoom,
					zoom,
				});
			};
			if (isReducedMotion) {
				apply(targetZoom);
				return;
			}
			const startTime = performance.now();
			const step = (now: number) => {
				const progress = easeOutCubic(
					Math.min(1, (now - startTime) / durationMs)
				);
				// Interpolate geometrically so every frame scales by the same ratio.
				apply(from.zoom * (targetZoom / from.zoom) ** progress);
				animationFrameRef.current =
					progress < 1 ? requestAnimationFrame(step) : null;
			};
			animationFrameRef.current = requestAnimationFrame(step);
		},
		[
			cancelAnimation,
			commit,
			focusDurationMs,
			getZoomLimits,
			isReducedMotion,
			notifyPreviewResolutionLimit,
		]
	);

	const getFitView = useCallback(
		(width: number, height: number) => {
			// On narrow screens the fitted content can be too small to read; start
			// at `minFitZoom` instead and let the user pan.
			const zoom = Math.max(
				Math.min(width / contentWidth, height / contentHeight),
				minFitZoom ?? 0
			);
			return {
				x: (width - contentWidth * zoom) / 2,
				y: (height - contentHeight * zoom) / 2,
				zoom,
			};
		},
		[contentHeight, contentWidth, minFitZoom]
	);

	const zoomAt = useCallback(
		(screenX: number, screenY: number, nextZoom: number) => {
			const { current } = viewRef;
			const limits = getZoomLimits(current.width, current.height);
			const zoom = clamp(nextZoom, limits.minZoom, limits.maxZoom);
			notifyPreviewResolutionLimit(zoom, current.zoom);
			const ratio = zoom / current.zoom;
			commit({
				...current,
				x: screenX - (screenX - current.x) * ratio,
				y: screenY - (screenY - current.y) * ratio,
				zoom,
			});
		},
		[commit, getZoomLimits, notifyPreviewResolutionLimit]
	);

	useEffect(() => {
		const container = containerRef.current;
		if (container === null) {
			return;
		}

		const handleResize = () => {
			const { clientHeight: height, clientWidth: width } = container;
			const { current } = viewRef;
			if (current.width === 0 || current.height === 0) {
				commit({ height, width, ...getFitView(width, height) });
				setFittedKey(resetKey);
				return;
			}
			if (current.width === width && current.height === height) {
				return;
			}
			commit({
				...current,
				height,
				width,
				x: current.x + (width - current.width) / 2,
				y: current.y + (height - current.height) / 2,
			});
		};

		handleResize();
		globalThis.addEventListener('resize', handleResize);

		if (typeof ResizeObserver === 'undefined') {
			return () => {
				globalThis.removeEventListener('resize', handleResize);
			};
		}

		// eslint-disable-next-line compat/compat -- Progressive enhancement; the viewport still follows window resizes without ResizeObserver.
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			globalThis.removeEventListener('resize', handleResize);
		};
	}, [commit, getFitView, resetKey]);

	// Refit when the content changes, before paint: a frame drawn with the
	// previous content's view would request tiles that are never shown.
	useLayoutEffect(() => {
		cancelAnimation();
		const { height, width } = viewRef.current;
		if (width === 0 || height === 0) {
			return;
		}
		commit({ ...viewRef.current, ...getFitView(width, height) });
		setFittedKey(resetKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Only a new `resetKey` refits.
	}, [resetKey]);

	useEffect(() => {
		if (focusRequest === null || fittedKey !== resetKey) {
			return;
		}
		const { height, width, zoom } = viewRef.current;
		if (width === 0 || height === 0) {
			return;
		}
		const limits = getZoomLimits(width, height);
		const targetZoom = clamp(
			Math.max(zoom, focusRequest.minZoom ?? 0),
			limits.minZoom,
			limits.maxZoom
		);
		notifyPreviewResolutionLimit(targetZoom, zoom);
		animateTo({
			x: width / 2 - focusRequest.x * targetZoom,
			y: height / 2 - focusRequest.y * targetZoom,
			zoom: targetZoom,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Reapply a pending request after a new map is fitted.
	}, [fittedKey, focusRequest?.key, resetKey]);

	useEffect(() => cancelAnimation, [cancelAnimation]);

	useLayoutEffect(() => {
		const { current } = viewRef;
		if (current.width !== 0 && current.height !== 0) {
			commit(current);
		}
	}, [commit]);

	const handleViewportNavigationAction = useCallback(
		(action: TViewportNavigationAction) => {
			switch (action.type) {
				case 'pan': {
					cancelAnimation();
					const { current } = viewRef;
					commit({
						...current,
						x: current.x + action.deltaX,
						y: current.y + action.deltaY,
					});
					return;
				}
				case 'zoom-by': {
					const nextZoom = viewRef.current.zoom * action.factor;
					if (action.durationMs > 0) {
						animateZoomAt(
							action.x,
							action.y,
							nextZoom,
							action.durationMs
						);
					} else {
						if (action.source !== 'wheel') {
							cancelAnimation();
						}
						zoomAt(action.x, action.y, nextZoom);
					}
					return;
				}
				case 'zoom-to':
					if (action.durationMs > 0) {
						animateZoomAt(
							action.x,
							action.y,
							action.zoom,
							action.durationMs
						);
					} else {
						cancelAnimation();
						zoomAt(action.x, action.y, action.zoom);
					}
					return;
				case 'fit': {
					const { height, width } = viewRef.current;
					animateTo(getFitView(width, height));
				}
			}
		},
		[animateTo, animateZoomAt, cancelAnimation, commit, getFitView, zoomAt]
	);

	const { fit, zoomIn, zoomOut } = useViewportNavigation({
		config: resolvedNavigationConfig,
		containerRef,
		onAction: handleViewportNavigationAction,
		onBackgroundPress,
		onInteractionStart: cancelAnimation,
		shouldIgnoreBackgroundPress,
		viewRef,
	});

	return (
		<div className={cn('relative overflow-hidden', className)}>
			<div
				ref={containerRef}
				aria-roledescription="map"
				role="application"
				tabIndex={0}
				className="absolute inset-0 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
			>
				{view.width > 0 && fittedKey === resetKey && children(view)}
			</div>
			{overlay}
			<div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
				{(
					[
						[faPlus, 'maps.zoom.in', zoomIn],
						[faMinus, 'maps.zoom.out', zoomOut],
						[faExpand, 'maps.zoom.fit', fit],
					] as const
				).map(([icon, label, onPress]) => (
					<Tooltip
						key={label}
						showArrow
						content={t(label)}
						placement="left"
						size="sm"
					>
						<FontAwesomeIconButton
							icon={icon}
							aria-label={t(label)}
							variant="flat"
							onPress={onPress}
							className="bg-content1/80 text-default-700 shadow-md backdrop-blur"
						/>
					</Tooltip>
				))}
			</div>
		</div>
	);
});
