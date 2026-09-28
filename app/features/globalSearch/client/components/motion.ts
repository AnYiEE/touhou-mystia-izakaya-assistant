import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

export const SPOTLIGHT_CONTENT_TRANSITION = {
	duration: MOTION_DURATION_S.base,
	ease: MOTION_EASE.standard,
	layout: {
		duration: MOTION_DURATION_S.base,
		ease: MOTION_EASE.standard,
		type: 'tween',
	},
	type: 'tween',
} as const;

export const SPOTLIGHT_LIST_TRANSITION = {
	duration: MOTION_DURATION_S.base,
	ease: MOTION_EASE.standard,
	layout: {
		duration: MOTION_DURATION_S.base,
		ease: MOTION_EASE.standard,
		type: 'tween',
	},
	type: 'tween',
} as const;

export const SPOTLIGHT_BLOCK_VARIANTS = {
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -6 },
	initial: { opacity: 0, y: 8 },
} as const;

export const SPOTLIGHT_MAIN_CONTENT_VARIANTS = {
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -5 },
	initial: { opacity: 0, y: 6 },
} as const;

export const SPOTLIGHT_RESULT_VARIANTS = {
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -4 },
	initial: { opacity: 0, y: 6 },
} as const;

export const SPOTLIGHT_PREVIEW_VARIANTS = {
	animate: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 8 },
	initial: { opacity: 0, x: 8 },
} as const;
