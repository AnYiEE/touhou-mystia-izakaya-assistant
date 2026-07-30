import { SPOTLIGHT_EXIT_DURATION_MS } from '@/features/overlays/client';

export const SPOTLIGHT_MODAL_MOTION_PROPS = {
	variants: {
		enter: {
			opacity: 1,
			scale: 1,
			transition: { duration: 0.16, ease: 'easeOut' },
		},
		exit: {
			opacity: 0,
			scale: 0.985,
			transition: {
				duration: SPOTLIGHT_EXIT_DURATION_MS / 1000,
				ease: 'easeIn',
			},
		},
		initial: { opacity: 0, scale: 0.985 },
	},
} as const;

export const SPOTLIGHT_CONTENT_TRANSITION = {
	duration: 0.22,
	ease: 'easeInOut',
	layout: { duration: 0.22, ease: 'easeInOut', type: 'tween' },
	type: 'tween',
} as const;

export const SPOTLIGHT_LIST_TRANSITION = {
	duration: 0.22,
	ease: 'easeInOut',
	layout: { duration: 0.22, ease: 'easeInOut', type: 'tween' },
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
