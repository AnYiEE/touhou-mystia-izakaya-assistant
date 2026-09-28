export const MOTION_DURATION_MS = { base: 200, fast: 100, slow: 300 } as const;

export const MOTION_DURATION_S = {
	base: MOTION_DURATION_MS.base / 1000,
	fast: MOTION_DURATION_MS.fast / 1000,
	slow: MOTION_DURATION_MS.slow / 1000,
} as const;

export const MOTION_EASE = {
	enter: 'easeOut',
	exit: 'easeIn',
	linear: 'linear',
	standard: 'easeInOut',
} as const;
