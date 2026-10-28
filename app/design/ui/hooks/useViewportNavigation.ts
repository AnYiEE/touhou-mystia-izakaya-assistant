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
		gestureIdleMs,
		keyboardPanPx,
		lineHeightPx,
		panProbeMs,
		pinchExponent,
		wheelExponent,
		wheelFallbackExponent,
		wheelZoomDurationMs,
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
		let gesturePreviousX = 0;
		let gesturePreviousY = 0;
		let isClickSuppressed = false;
		let isBackgroundPressIgnored = false;
		let pointerDrag: {
			distance: number;
			isDragging: boolean;
			startX: number;
			startY: number;
		} | null = null;
		let wheelGestureMode: 'mouse' | 'pan' | null = null;
		let lastWheelEventAt = Number.NEGATIVE_INFINITY;
		let pendingWheel: {
			delta: { x: number; y: number };
			x: number;
			y: number;
			timeStamp: number;
		} | null = null;
		let pendingWheelTimeout: ReturnType<typeof setTimeout> | null = null;
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

		const clearPendingWheel = () => {
			if (pendingWheelTimeout !== null) {
				clearTimeout(pendingWheelTimeout);
				pendingWheelTimeout = null;
			}
			pendingWheel = null;
		};

		const emitAction = (action: TViewportNavigationAction) => {
			callbacksRef.current.onAction(action);
		};

		const emitWheelZoom = (
			deltaY: number,
			x: number,
			y: number,
			isFallback: boolean
		) => {
			const direction = Math.sign(deltaY);
			if (direction === 0) {
				return;
			}
			const exponent = isFallback ? wheelFallbackExponent : wheelExponent;
			emitAction({
				durationMs: wheelZoomDurationMs,
				factor: Math.exp(-direction * exponent),
				source: 'wheel',
				type: 'zoom-by',
				x,
				y,
			});
		};

		const emitWheelPan = (deltaX: number, deltaY: number) => {
			emitAction({
				deltaX: -deltaX,
				deltaY: -deltaY,
				source: 'wheel',
				type: 'pan',
			});
		};

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			callbacksRef.current.onInteractionStart?.();
			const now = performance.now();
			if (now - lastWheelEventAt > gestureIdleMs) {
				wheelGestureMode = null;
			}
			lastWheelEventAt = now;
			const rect = container.getBoundingClientRect();
			const delta = getWheelDelta(
				event,
				viewRef.current.height,
				lineHeightPx
			);
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			if (delta.x === 0 && delta.y === 0) {
				clearPendingWheel();
				wheelGestureMode = 'mouse';
				return;
			}
			if (event.ctrlKey || event.metaKey) {
				clearPendingWheel();
				wheelGestureMode = null;
				emitAction({
					durationMs: wheelZoomDurationMs,
					factor:
						delta.y === 0 ? 1 : Math.exp(-delta.y * pinchExponent),
					source: 'pinch',
					type: 'zoom-by',
					x,
					y,
				});
				return;
			}
			const isTrackpadPanSignal = event.deltaX !== 0;
			if (wheelGestureMode === 'pan') {
				emitWheelPan(delta.x, delta.y);
				return;
			}
			if (wheelGestureMode === 'mouse') {
				emitWheelZoom(delta.y, x, y, false);
				return;
			}
			if (pendingWheel !== null) {
				const pending = pendingWheel;
				clearPendingWheel();
				if (
					isTrackpadPanSignal ||
					event.timeStamp !== pending.timeStamp
				) {
					emitWheelPan(pending.delta.x, pending.delta.y);
					emitWheelPan(delta.x, delta.y);
					wheelGestureMode = 'pan';
				} else {
					wheelGestureMode = 'mouse';
					emitWheelZoom(pending.delta.y, pending.x, pending.y, true);
				}
				return;
			}
			if (isTrackpadPanSignal) {
				wheelGestureMode = 'pan';
				emitWheelPan(delta.x, delta.y);
				return;
			}
			pendingWheel = { delta, timeStamp: event.timeStamp, x, y };
			pendingWheelTimeout = setTimeout(() => {
				const pending = pendingWheel;
				clearPendingWheel();
				if (pending !== null) {
					wheelGestureMode = 'mouse';
					emitWheelZoom(pending.delta.y, pending.x, pending.y, true);
				}
			}, panProbeMs);
		};

		const handleGestureStart = (event: Event) => {
			event.preventDefault();
			callbacksRef.current.onInteractionStart?.();
			const gesture = event as IWebKitGestureEvent;
			const point = getGesturePoint(
				gesture,
				container.getBoundingClientRect()
			);
			gestureStartZoom = viewRef.current.zoom;
			gesturePreviousX = point.x;
			gesturePreviousY = point.y;
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
				deltaX: point.x - gesturePreviousX,
				deltaY: point.y - gesturePreviousY,
				source: 'gesture',
				type: 'pan',
			});
			emitAction({
				durationMs: 0,
				source: 'gesture',
				type: 'zoom-to',
				x: point.x,
				y: point.y,
				zoom: gestureStartZoom * gesture.scale,
			});
			gesturePreviousX = point.x;
			gesturePreviousY = point.y;
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
			clearPendingWheel();
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
		focusDurationMs,
		gestureIdleMs,
		keyboardPanPx,
		lineHeightPx,
		panProbeMs,
		pinchExponent,
		viewRef,
		wheelExponent,
		wheelFallbackExponent,
		wheelZoomDurationMs,
	]);

	return { fit, zoomIn, zoomOut };
}
