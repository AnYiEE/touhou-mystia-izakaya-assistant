import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

export const MAP_COLLAPSE_ANIMATE = {
	height: 'auto',
	opacity: 1,
	overflow: 'hidden',
	transitionEnd: { overflow: 'visible' },
} as const;

export const MAP_COLLAPSE_HIDDEN = {
	height: 0,
	opacity: 0,
	overflow: 'hidden',
} as const;

export const MAP_FADE_ANIMATE = { opacity: 1 } as const;

export const MAP_FADE_HIDDEN = { opacity: 0 } as const;

const MAP_TRANSITION = {
	duration: MOTION_DURATION_S.base,
	ease: MOTION_EASE.standard,
} as const;

const REDUCED_MOTION_TRANSITION = { duration: 0 } as const;

export function getMapTransition(isReducedMotion: boolean) {
	return isReducedMotion ? REDUCED_MOTION_TRANSITION : MAP_TRANSITION;
}
