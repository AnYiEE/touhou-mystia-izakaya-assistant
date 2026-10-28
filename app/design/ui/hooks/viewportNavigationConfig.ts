export interface IViewportNavigationConfig {
	buttonZoomStep: number;
	dragThresholdPx: number;
	focusDurationMs: number;
	gestureIdleMs: number;
	keyboardPanPx: number;
	lineHeightPx: number;
	minZoomFitRatio: number;
	panProbeMs: number;
	pinchExponent: number;
	wheelExponent: number;
	wheelFallbackExponent: number;
	wheelZoomDurationMs: number;
}

export const DEFAULT_VIEWPORT_NAVIGATION_CONFIG = {
	buttonZoomStep: 1.6,
	dragThresholdPx: 5,
	focusDurationMs: 420,
	gestureIdleMs: 150,
	keyboardPanPx: 80,
	lineHeightPx: 16,
	minZoomFitRatio: 0.8,
	panProbeMs: 32,
	pinchExponent: 0.01,
	wheelExponent: 0.015,
	wheelFallbackExponent: 0.16,
	wheelZoomDurationMs: 0,
} as const satisfies IViewportNavigationConfig;
