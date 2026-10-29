export interface IViewportNavigationConfig {
	buttonZoomStep: number;
	dragThresholdPx: number;
	focusDurationMs: number;
	keyboardPanPx: number;
	lineHeightPx: number;
	minZoomFitRatio: number;
	pinchExponent: number;
	wheelAxisWindowMs: number;
	wheelExponent: number;
	wheelGestureIdleMs: number;
	wheelZoomEpsilon: number;
	wheelZoomIntervalMs: number;
	wheelZoomSmoothingMs: number;
}

export const DEFAULT_VIEWPORT_NAVIGATION_CONFIG = {
	buttonZoomStep: 1.6,
	dragThresholdPx: 5,
	focusDurationMs: 420,
	keyboardPanPx: 80,
	lineHeightPx: 16,
	minZoomFitRatio: 0.8,
	pinchExponent: 0.01,
	wheelAxisWindowMs: 32,
	wheelExponent: Math.log(1.3),
	wheelGestureIdleMs: 150,
	wheelZoomEpsilon: 0.001,
	wheelZoomIntervalMs: 80,
	wheelZoomSmoothingMs: 80,
} as const satisfies IViewportNavigationConfig;
