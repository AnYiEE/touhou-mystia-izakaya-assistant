'use client';

import { type RefObject, useCallback, useEffect, useRef } from 'react';

import {
	DEFAULT_VIEWPORT_NAVIGATION_CONFIG,
	type IViewportNavigationConfig,
} from './viewportNavigationConfig';

interface IViewportNavigationView {
	height: number;
	width: number;
	zoom: number;
}

type TViewportNavigationSource =
	'button' | 'gesture' | 'keyboard' | 'pinch' | 'pointer' | 'wheel';

export type TViewportNavigationAction =
	| {
			deltaX: number;
			deltaY: number;
			source: TViewportNavigationSource;
			type: 'pan';
	  }
	| {
			durationMs: number;
			factor: number;
			source: TViewportNavigationSource;
			type: 'zoom-by';
			x: number;
			y: number;
	  }
	| {
			durationMs: number;
			source: 'gesture';
			type: 'zoom-to';
			x: number;
			y: number;
			zoom: number;
	  }
	| { type: 'fit' };

interface IUseViewportNavigationOptions<TView extends IViewportNavigationView> {
	config?: Partial<IViewportNavigationConfig> | undefined;
	containerRef: RefObject<HTMLDivElement | null>;
	onAction: (action: TViewportNavigationAction) => void;
	onBackgroundPress?: (() => void) | undefined;
	onInteractionStart?: (() => void) | undefined;
	shouldIgnoreBackgroundPress?: (() => boolean) | undefined;
	viewRef: RefObject<TView>;
}

export interface IViewportNavigationMethods {
	fit: () => void;
	zoomIn: () => void;
	zoomOut: () => void;
}

/** @description Non-standard WebKit trackpad gesture fired by Safari. */
interface IWebKitGestureEvent extends Event {
	clientX?: number;
	clientY?: number;
	scale: number;
}

function getWheelDelta(
	event: WheelEvent,
	viewportHeight: number,
	lineHeightPx: number
) {
	const multiplier =
		event.deltaMode === WheelEvent.DOM_DELTA_LINE
			? lineHeightPx
			: event.deltaMode === WheelEvent.DOM_DELTA_PAGE
				? viewportHeight
				: 1;
	return { x: event.deltaX * multiplier, y: event.deltaY * multiplier };
}

export function useViewportNavigation<TView extends IViewportNavigationView>({
	config = {},
	containerRef,
	onAction,
	onBackgroundPress,
	onInteractionStart,
	shouldIgnoreBackgroundPress,
	viewRef,
}: IUseViewportNavigationOptions<TView>): IViewportNavigationMethods {
	const {
		buttonZoomStep,
		dragThresholdPx,
		focusDurationMs,
		keyboardPanPx,
		lineHeightPx,
		pinchExponent,
		wheelAxisWindowMs,
		wheelExponent,
		wheelGestureIdleMs,
		wheelZoomEpsilon,
		wheelZoomIntervalMs,
		wheelZoomSmoothingMs,
	} = { ...DEFAULT_VIEWPORT_NAVIGATION_CONFIG, ...config };

	const callbacksRef = useRef({
		onAction,
		onBackgroundPress,
		onInteractionStart,
		shouldIgnoreBackgroundPress,
	});

	useEffect(() => {
		callbacksRef.current = {
			onAction,
			onBackgroundPress,
			onInteractionStart,
			shouldIgnoreBackgroundPress,
		};
	}, [
		onAction,
		onBackgroundPress,
		onInteractionStart,
		shouldIgnoreBackgroundPress,
	]);

	const zoomBy = useCallback(
		(
			factor: number,
			durationMs: number,
			source: TViewportNavigationSource
		) => {
			const { height, width } = viewRef.current;
			onAction({
				durationMs,
				factor,
				source,
				type: 'zoom-by',
				x: width / 2,
				y: height / 2,
			});
		},
		[onAction, viewRef]
	);

	const zoomIn = useCallback(() => {
		zoomBy(buttonZoomStep, focusDurationMs, 'button');
	}, [buttonZoomStep, focusDurationMs, zoomBy]);

	const zoomOut = useCallback(() => {
		zoomBy(1 / buttonZoomStep, focusDurationMs, 'button');
	}, [buttonZoomStep, focusDurationMs, zoomBy]);

	const fit = useCallback(() => {
		onAction({ type: 'fit' });
	}, [onAction]);

	useEffect(() => {
		const container = containerRef.current;
		if (container === null) {
			return;
		}
		const pointers = new Map<number, { x: number; y: number }>();
		let gestureStartZoom: number | null = null;
		let isClickSuppressed = false;
		let isBackgroundPressIgnored = false;
		let pointerDrag: {
			distance: number;
			isDragging: boolean;
			startX: number;
			startY: number;
		} | null = null;
		let pendingWheelZoomLog = 0;
		let wheelZoomPoint: { x: number; y: number } | null = null;
		let wheelZoomFrame: number | null = null;
		let lastWheelZoomFrameAt: number | null = null;
		let lastWheelEventAt = Number.NEGATIVE_INFINITY;
		let nextWheelZoomAt = Number.NEGATIVE_INFINITY;
		let wheelAxisMode: 'horizontal' | 'vertical' | null = null;
		let pendingWheelAxis: {
			direction: -1 | 1;
			x: number;
			y: number;
		} | null = null;
		let wheelAxisTimeout: ReturnType<typeof setTimeout> | null = null;
		let clickResetTimeout: ReturnType<typeof setTimeout> | null = null;

		const getGesturePoint = (
			gesture: IWebKitGestureEvent,
			rect: DOMRect
		) => ({
			x:
				typeof gesture.clientX === 'number' &&
				Number.isFinite(gesture.clientX)
					? gesture.clientX - rect.left
					: rect.width / 2,
			y:
				typeof gesture.clientY === 'number' &&
				Number.isFinite(gesture.clientY)
					? gesture.clientY - rect.top
					: rect.height / 2,
		});

		const emitAction = (action: TViewportNavigationAction) => {
			callbacksRef.current.onAction(action);
		};

		const clearWheelZoom = () => {
			if (wheelZoomFrame !== null) {
				cancelAnimationFrame(wheelZoomFrame);
			}
			wheelZoomFrame = null;
			pendingWheelZoomLog = 0;
			wheelZoomPoint = null;
			lastWheelZoomFrameAt = null;
		};

		const clearWheelAxis = () => {
			if (wheelAxisTimeout !== null) {
				clearTimeout(wheelAxisTimeout);
				wheelAxisTimeout = null;
			}
			pendingWheelAxis = null;
			wheelAxisMode = null;
			nextWheelZoomAt = Number.NEGATIVE_INFINITY;
		};

		const flushWheelZoom = (now: number) => {
			wheelZoomFrame = null;
			const point = wheelZoomPoint;
			if (point === null || pendingWheelZoomLog === 0) {
				clearWheelZoom();
				return;
			}
			const elapsedMs =
				lastWheelZoomFrameAt === null
					? 0
					: Math.max(0, now - lastWheelZoomFrameAt);
			lastWheelZoomFrameAt = now;
			const progress =
				wheelZoomSmoothingMs <= 0
					? 1
					: 1 - Math.exp(-elapsedMs / wheelZoomSmoothingMs);
			const appliedLog = pendingWheelZoomLog * progress;
			pendingWheelZoomLog -= appliedLog;
			if (appliedLog !== 0) {
				emitAction({
					durationMs: 0,
					factor: Math.exp(appliedLog),
					source: 'wheel',
					type: 'zoom-by',
					x: point.x,
					y: point.y,
				});
			}
			if (Math.abs(pendingWheelZoomLog) > wheelZoomEpsilon) {
				wheelZoomFrame = requestAnimationFrame(flushWheelZoom);
				return;
			}
			clearWheelZoom();
		};

		const queueWheelZoom = (
			direction: -1 | 1,
			x: number,
			y: number,
			now: number
		) => {
			if (now < nextWheelZoomAt) {
				return;
			}
			nextWheelZoomAt = now + Math.max(0, wheelZoomIntervalMs);
			pendingWheelZoomLog -= direction * wheelExponent;
			wheelZoomPoint = { x, y };
			lastWheelZoomFrameAt ??= now;
			wheelZoomFrame ??= requestAnimationFrame(flushWheelZoom);
		};

		const handleVerticalWheel = (
			direction: -1 | 1,
			x: number,
			y: number,
			now: number
		) => {
			if (wheelAxisMode === 'horizontal') {
				return;
			}
			if (wheelAxisMode === 'vertical') {
				queueWheelZoom(direction, x, y, now);
				return;
			}
			pendingWheelAxis ??= { direction, x, y };
			wheelAxisTimeout ??= setTimeout(
				() => {
					wheelAxisTimeout = null;
					const pending = pendingWheelAxis;
					pendingWheelAxis = null;
					if (pending === null) {
						return;
					}
					wheelAxisMode = 'vertical';
					queueWheelZoom(
						pending.direction,
						pending.x,
						pending.y,
						performance.now()
					);
				},
				Math.max(0, wheelAxisWindowMs)
			);
		};

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			callbacksRef.current.onInteractionStart?.();
			const now = performance.now();
			if (now - lastWheelEventAt > wheelGestureIdleMs) {
				clearWheelAxis();
			}
			lastWheelEventAt = now;
			const delta = getWheelDelta(
				event,
				viewRef.current.height,
				lineHeightPx
			);
			if (delta.x === 0 && delta.y === 0) {
				return;
			}
			if (event.ctrlKey || event.metaKey) {
				clearWheelAxis();
				clearWheelZoom();
				const rect = container.getBoundingClientRect();
				emitAction({
					durationMs: 0,
					factor:
						delta.y === 0 ? 1 : Math.exp(-delta.y * pinchExponent),
					source: 'pinch',
					type: 'zoom-by',
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				});
				return;
			}
			if (delta.x !== 0) {
				clearWheelAxis();
				wheelAxisMode = 'horizontal';
				clearWheelZoom();
				return;
			}
			const rect = container.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			if (delta.y < 0) {
				handleVerticalWheel(-1, x, y, now);
			} else if (delta.y > 0) {
				handleVerticalWheel(1, x, y, now);
			}
		};

		const handleGestureStart = (event: Event) => {
			event.preventDefault();
			clearWheelAxis();
			clearWheelZoom();
			callbacksRef.current.onInteractionStart?.();
			gestureStartZoom = viewRef.current.zoom;
		};

		const handleGestureChange = (event: Event) => {
			event.preventDefault();
			const gesture = event as IWebKitGestureEvent;
			gestureStartZoom ??= viewRef.current.zoom;
			const point = getGesturePoint(
				gesture,
				container.getBoundingClientRect()
			);
			emitAction({
				durationMs: 0,
				source: 'gesture',
				type: 'zoom-to',
				x: point.x,
				y: point.y,
				zoom: gestureStartZoom * gesture.scale,
			});
		};

		const handleGestureEnd = (event: Event) => {
			event.preventDefault();
			gestureStartZoom = null;
		};

		const handlePointerDown = (event: PointerEvent) => {
			if (
				event.pointerType === 'mouse' &&
				event.button !== 0 &&
				event.button !== 1
			) {
				return;
			}
			if (event.pointerType === 'mouse' && event.button === 1) {
				event.preventDefault();
			}
			clearWheelAxis();
			clearWheelZoom();
			callbacksRef.current.onInteractionStart?.();
			if (pointers.size === 0) {
				isBackgroundPressIgnored =
					callbacksRef.current.shouldIgnoreBackgroundPress?.() ??
					false;
			}
			pointers.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			const points = [...pointers.values()];
			const [first, second] = points;
			pointerDrag = {
				distance:
					first !== undefined && second !== undefined
						? Math.hypot(first.x - second.x, first.y - second.y)
						: 0,
				isDragging: pointerDrag?.isDragging ?? false,
				startX: event.clientX,
				startY: event.clientY,
			};
		};

		const handlePointerMove = (event: PointerEvent) => {
			const previous = pointers.get(event.pointerId);
			const gesture = pointerDrag;
			if (previous === undefined || gesture === null) {
				return;
			}
			if (
				!gesture.isDragging &&
				Math.hypot(
					event.clientX - gesture.startX,
					event.clientY - gesture.startY
				) > dragThresholdPx
			) {
				gesture.isDragging = true;
				container.setPointerCapture(event.pointerId);
			}
			pointers.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			if (!gesture.isDragging) {
				return;
			}

			const points = [...pointers.values()];
			const [first, second] = points;
			if (first !== undefined && second !== undefined) {
				const distance = Math.hypot(
					first.x - second.x,
					first.y - second.y
				);
				const rect = container.getBoundingClientRect();
				if (gesture.distance > 0) {
					emitAction({
						durationMs: 0,
						factor: distance / gesture.distance,
						source: 'pointer',
						type: 'zoom-by',
						x: (first.x + second.x) / 2 - rect.left,
						y: (first.y + second.y) / 2 - rect.top,
					});
				}
				gesture.distance = distance;
				emitAction({
					deltaX: (event.clientX - previous.x) / 2,
					deltaY: (event.clientY - previous.y) / 2,
					source: 'pointer',
					type: 'pan',
				});
				return;
			}

			emitAction({
				deltaX: event.clientX - previous.x,
				deltaY: event.clientY - previous.y,
				source: 'pointer',
				type: 'pan',
			});
		};

		const handlePointerEnd = (event: PointerEvent) => {
			pointers.delete(event.pointerId);
			const gesture = pointerDrag;
			if (pointers.size > 0) {
				if (gesture !== null) {
					gesture.distance = 0;
				}
				return;
			}
			if (gesture?.isDragging) {
				isClickSuppressed = true;
				if (clickResetTimeout !== null) {
					clearTimeout(clickResetTimeout);
				}
				clickResetTimeout = setTimeout(() => {
					clickResetTimeout = null;
					isClickSuppressed = false;
				}, 0);
			}
			pointerDrag = null;
		};

		const handleClickCapture = (event: MouseEvent) => {
			if (isClickSuppressed) {
				event.preventDefault();
				event.stopPropagation();
			}
		};

		const handleClick = (event: MouseEvent) => {
			if (
				event.target === event.currentTarget &&
				!isBackgroundPressIgnored
			) {
				callbacksRef.current.onBackgroundPress?.();
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== event.currentTarget) {
				return;
			}
			const { height, width } = viewRef.current;
			const centerX = width / 2;
			const centerY = height / 2;
			switch (event.key) {
				case 'ArrowLeft':
					emitAction({
						deltaX: keyboardPanPx,
						deltaY: 0,
						source: 'keyboard',
						type: 'pan',
					});
					break;
				case 'ArrowRight':
					emitAction({
						deltaX: -keyboardPanPx,
						deltaY: 0,
						source: 'keyboard',
						type: 'pan',
					});
					break;
				case 'ArrowUp':
					emitAction({
						deltaX: 0,
						deltaY: keyboardPanPx,
						source: 'keyboard',
						type: 'pan',
					});
					break;
				case 'ArrowDown':
					emitAction({
						deltaX: 0,
						deltaY: -keyboardPanPx,
						source: 'keyboard',
						type: 'pan',
					});
					break;
				case '+':
				case '=':
					emitAction({
						durationMs: 0,
						factor: buttonZoomStep,
						source: 'keyboard',
						type: 'zoom-by',
						x: centerX,
						y: centerY,
					});
					break;
				case '-':
				case '_':
					emitAction({
						durationMs: 0,
						factor: 1 / buttonZoomStep,
						source: 'keyboard',
						type: 'zoom-by',
						x: centerX,
						y: centerY,
					});
					break;
				case '0':
					emitAction({ type: 'fit' });
					break;
				default:
					return;
			}
			event.preventDefault();
		};

		container.addEventListener('wheel', handleWheel, { passive: false });
		container.addEventListener('gesturestart', handleGestureStart, {
			passive: false,
		});
		container.addEventListener('gesturechange', handleGestureChange, {
			passive: false,
		});
		container.addEventListener('gestureend', handleGestureEnd, {
			passive: false,
		});
		container.addEventListener('pointerdown', handlePointerDown);
		container.addEventListener('pointermove', handlePointerMove);
		container.addEventListener('pointerup', handlePointerEnd);
		container.addEventListener('pointercancel', handlePointerEnd);
		container.addEventListener('click', handleClick);
		container.addEventListener('click', handleClickCapture, true);
		container.addEventListener('keydown', handleKeyDown);

		return () => {
			clearWheelAxis();
			clearWheelZoom();
			if (clickResetTimeout !== null) {
				clearTimeout(clickResetTimeout);
			}
			container.removeEventListener('wheel', handleWheel);
			container.removeEventListener('gesturestart', handleGestureStart);
			container.removeEventListener('gesturechange', handleGestureChange);
			container.removeEventListener('gestureend', handleGestureEnd);
			container.removeEventListener('pointerdown', handlePointerDown);
			container.removeEventListener('pointermove', handlePointerMove);
			container.removeEventListener('pointerup', handlePointerEnd);
			container.removeEventListener('pointercancel', handlePointerEnd);
			container.removeEventListener('click', handleClick);
			container.removeEventListener('click', handleClickCapture, true);
			container.removeEventListener('keydown', handleKeyDown);
		};
	}, [
		buttonZoomStep,
		containerRef,
		dragThresholdPx,
		keyboardPanPx,
		lineHeightPx,
		pinchExponent,
		viewRef,
		wheelAxisWindowMs,
		wheelExponent,
		wheelGestureIdleMs,
		wheelZoomEpsilon,
		wheelZoomIntervalMs,
		wheelZoomSmoothingMs,
	]);

	return { fit, zoomIn, zoomOut };
}
