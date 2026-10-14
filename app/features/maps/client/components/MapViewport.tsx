'use client';

import {
	type KeyboardEvent,
	type PointerEvent,
	type ReactNode,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { faExpand, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@heroui/theme';

import FontAwesomeIconButton from '@/design/ui/components/fontAwesomeIconButton';
import Tooltip from '@/design/ui/components/tooltip';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

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
	maxZoom: number;
	/** @description Lower bound for the fitted zoom used initially and by the fit button. */
	minFitZoom?: number;
	/** @description Called when the empty map area is clicked. */
	onBackgroundPress?: () => void;
	overlay?: ReactNode;
	/** @description Changing it refits the content into the viewport. */
	resetKey: string;
}

const DRAG_THRESHOLD_PX = 5;
const FOCUS_DURATION_MS = 420;
const KEYBOARD_PAN_PX = 80;
const WHEEL_ZOOM_SPEED = 0.0015;
const BUTTON_ZOOM_STEP = 1.6;
const MIN_ZOOM_FIT_RATIO = 0.8;

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function easeOutCubic(progress: number) {
	return 1 - (1 - progress) ** 3;
}

export default memo<IProps>(function MapViewport({
	children,
	className,
	contentHeight,
	contentWidth,
	focusRequest,
	maxZoom,
	minFitZoom,
	onBackgroundPress,
	overlay,
	resetKey,
}) {
	const { t } = useI18n(mapsMessages);
	const isReducedMotion = useReducedMotion();

	const containerRef = useRef<HTMLDivElement>(null);
	const [view, setView] = useState<IMapView>({
		height: 0,
		width: 0,
		x: 0,
		y: 0,
		zoom: 1,
	});
	const viewRef = useRef(view);
	const animationFrameRef = useRef<number | null>(null);
	const pointersRef = useRef(new Map<number, { x: number; y: number }>());
	const gestureRef = useRef<{
		distance: number;
		isDragging: boolean;
		startX: number;
		startY: number;
	} | null>(null);
	const isClickSuppressedRef = useRef(false);

	/** @description Zoom limits for a viewport size; the content may shrink to 80% of the fitted size. */
	const getZoomLimits = useCallback(
		(width: number, height: number) => {
			const fitZoom =
				width === 0 || height === 0
					? 1
					: Math.min(width / contentWidth, height / contentHeight);
			const minZoom = fitZoom * MIN_ZOOM_FIT_RATIO;
			return { maxZoom: Math.max(maxZoom, minZoom), minZoom };
		},
		[contentHeight, contentWidth, maxZoom]
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
			const clamped = { ...next, x, y, zoom };
			viewRef.current = clamped;
			setView(clamped);
		},
		[contentHeight, contentWidth, getZoomLimits]
	);

	const cancelAnimation = useCallback(() => {
		if (animationFrameRef.current !== null) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	}, []);

	const animateTo = useCallback(
		(target: Pick<IMapView, 'x' | 'y' | 'zoom'>) => {
			cancelAnimation();
			const { current: from } = viewRef;
			if (isReducedMotion) {
				commit({ ...from, ...target });
				return;
			}
			const startTime = performance.now();
			const step = (now: number) => {
				const progress = easeOutCubic(
					Math.min(1, (now - startTime) / FOCUS_DURATION_MS)
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
		[cancelAnimation, commit, isReducedMotion]
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
			const ratio = zoom / current.zoom;
			commit({
				...current,
				x: screenX - (screenX - current.x) * ratio,
				y: screenY - (screenY - current.y) * ratio,
				zoom,
			});
		},
		[commit, getZoomLimits]
	);

	// Track the viewport size.
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
	}, [commit, getFitView]);

	// Refit when the content changes.
	useEffect(() => {
		cancelAnimation();
		const { height, width } = viewRef.current;
		if (width === 0 || height === 0) {
			return;
		}
		commit({ ...viewRef.current, ...getFitView(width, height) });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Only a new `resetKey` refits.
	}, [resetKey]);

	useEffect(() => {
		if (focusRequest === null) {
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
		animateTo({
			x: width / 2 - focusRequest.x * targetZoom,
			y: height / 2 - focusRequest.y * targetZoom,
			zoom: targetZoom,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Only a new request moves the view.
	}, [focusRequest?.key]);

	useEffect(() => cancelAnimation, [cancelAnimation]);

	// Wheel zoom needs a non-passive listener to prevent page scrolling.
	useEffect(() => {
		const container = containerRef.current;
		if (container === null) {
			return;
		}
		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			cancelAnimation();
			const rect = container.getBoundingClientRect();
			const delta =
				event.deltaMode === WheelEvent.DOM_DELTA_LINE
					? event.deltaY * 16
					: event.deltaY;
			zoomAt(
				event.clientX - rect.left,
				event.clientY - rect.top,
				viewRef.current.zoom * Math.exp(-delta * WHEEL_ZOOM_SPEED)
			);
		};
		container.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			container.removeEventListener('wheel', handleWheel);
		};
	}, [cancelAnimation, zoomAt]);

	const handlePointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (event.pointerType === 'mouse' && event.button !== 0) {
				return;
			}
			cancelAnimation();
			pointersRef.current.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			const points = [...pointersRef.current.values()];
			const [first, second] = points;
			gestureRef.current = {
				distance:
					first !== undefined && second !== undefined
						? Math.hypot(first.x - second.x, first.y - second.y)
						: 0,
				isDragging: gestureRef.current?.isDragging ?? false,
				startX: event.clientX,
				startY: event.clientY,
			};
		},
		[cancelAnimation]
	);

	const handlePointerMove = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			const previous = pointersRef.current.get(event.pointerId);
			const gesture = gestureRef.current;
			if (previous === undefined || gesture === null) {
				return;
			}
			const container = event.currentTarget;
			if (
				!gesture.isDragging &&
				Math.hypot(
					event.clientX - gesture.startX,
					event.clientY - gesture.startY
				) > DRAG_THRESHOLD_PX
			) {
				gesture.isDragging = true;
				container.setPointerCapture(event.pointerId);
			}
			pointersRef.current.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			if (!gesture.isDragging) {
				return;
			}

			const points = [...pointersRef.current.values()];
			const [first, second] = points;
			if (first !== undefined && second !== undefined) {
				const distance = Math.hypot(
					first.x - second.x,
					first.y - second.y
				);
				const rect = container.getBoundingClientRect();
				if (gesture.distance > 0) {
					zoomAt(
						(first.x + second.x) / 2 - rect.left,
						(first.y + second.y) / 2 - rect.top,
						viewRef.current.zoom * (distance / gesture.distance)
					);
				}
				gesture.distance = distance;
				const { current } = viewRef;
				commit({
					...current,
					x: current.x + (event.clientX - previous.x) / 2,
					y: current.y + (event.clientY - previous.y) / 2,
				});
				return;
			}

			const { current } = viewRef;
			commit({
				...current,
				x: current.x + event.clientX - previous.x,
				y: current.y + event.clientY - previous.y,
			});
		},
		[commit, zoomAt]
	);

	const handlePointerEnd = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			pointersRef.current.delete(event.pointerId);
			const gesture = gestureRef.current;
			if (pointersRef.current.size > 0) {
				if (gesture !== null) {
					gesture.distance = 0;
				}
				return;
			}
			if (gesture?.isDragging) {
				isClickSuppressedRef.current = true;
				setTimeout(() => {
					isClickSuppressedRef.current = false;
				}, 0);
			}
			gestureRef.current = null;
		},
		[]
	);

	const handleClickCapture = useCallback(
		(event: {
			preventDefault: () => void;
			stopPropagation: () => void;
		}) => {
			if (isClickSuppressedRef.current) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		[]
	);

	const handleClick = useCallback(
		(event: { currentTarget: EventTarget; target: EventTarget }) => {
			if (event.target === event.currentTarget) {
				onBackgroundPress?.();
			}
		},
		[onBackgroundPress]
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.target !== event.currentTarget) {
				return;
			}
			const { current } = viewRef;
			const centerX = current.width / 2;
			const centerY = current.height / 2;
			switch (event.key) {
				case 'ArrowLeft':
					commit({ ...current, x: current.x + KEYBOARD_PAN_PX });
					break;
				case 'ArrowRight':
					commit({ ...current, x: current.x - KEYBOARD_PAN_PX });
					break;
				case 'ArrowUp':
					commit({ ...current, y: current.y + KEYBOARD_PAN_PX });
					break;
				case 'ArrowDown':
					commit({ ...current, y: current.y - KEYBOARD_PAN_PX });
					break;
				case '+':
				case '=':
					zoomAt(centerX, centerY, current.zoom * BUTTON_ZOOM_STEP);
					break;
				case '-':
				case '_':
					zoomAt(centerX, centerY, current.zoom / BUTTON_ZOOM_STEP);
					break;
				case '0':
					animateTo(getFitView(current.width, current.height));
					break;
				default:
					return;
			}
			event.preventDefault();
		},
		[animateTo, commit, getFitView, zoomAt]
	);

	const zoomBy = useCallback(
		(factor: number) => {
			const { current } = viewRef;
			animateTo({
				x: current.width / 2 - (current.width / 2 - current.x) * factor,
				y:
					current.height / 2 -
					(current.height / 2 - current.y) * factor,
				zoom: current.zoom * factor,
			});
		},
		[animateTo]
	);

	const handleZoomIn = useCallback(() => {
		zoomBy(BUTTON_ZOOM_STEP);
	}, [zoomBy]);
	const handleZoomOut = useCallback(() => {
		zoomBy(1 / BUTTON_ZOOM_STEP);
	}, [zoomBy]);
	const handleFit = useCallback(() => {
		const { height, width } = viewRef.current;
		animateTo(getFitView(width, height));
	}, [animateTo, getFitView]);

	return (
		<div className={cn('relative overflow-hidden', className)}>
			<div
				ref={containerRef}
				aria-roledescription="map"
				role="application"
				tabIndex={0}
				onClick={handleClick}
				onClickCapture={handleClickCapture}
				onKeyDown={handleKeyDown}
				onPointerCancel={handlePointerEnd}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerEnd}
				className="absolute inset-0 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
			>
				{view.width > 0 && children(view)}
			</div>
			{overlay}
			<div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
				{(
					[
						[faPlus, 'maps.zoom.in', handleZoomIn],
						[faMinus, 'maps.zoom.out', handleZoomOut],
						[faExpand, 'maps.zoom.fit', handleFit],
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
