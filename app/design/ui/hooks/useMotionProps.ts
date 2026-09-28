import { useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

const MOTION_DEFAULT = {} as const;

const MOTION_POPOVER = {
	variants: {
		enter: {
			transform: 'scale(1)',
			transition: {
				bounce: 0,
				duration: MOTION_DURATION_S.slow,
				type: 'spring',
			},
		},
		exit: {
			opacity: 0,
			transform: 'scale(0.96)',
			transition: {
				duration: MOTION_DURATION_S.fast,
				ease: MOTION_EASE.exit,
			},
		},
		initial: { transform: 'scale(0.8)' },
	},
} as const;

const MOTION_SELECT = {
	variants: {
		enter: {
			transform: 'scale(1)',
			transition: { duration: 0.15, ease: 'easeIn' },
		},
		exit: {
			opacity: 0,
			transform: 'scale(0.96, 1)',
			transition: { duration: 0.3, ease: 'easeOut' },
		},
		initial: { transform: 'scale(0.96, 1)' },
	},
} as const;

const MOTION_TOOLTIP = {
	variants: {
		enter: {
			transform: 'scale(1)',
			transition: {
				bounce: 0,
				duration: MOTION_DURATION_S.fast,
				type: 'spring',
			},
		},
		exit: {
			transform: 'scale(0)',
			transition: {
				duration: MOTION_DURATION_S.fast,
				ease: MOTION_EASE.exit,
			},
		},
		initial: { transform: 'scale(0.8)' },
	},
} as const;

const MOTION_PROP_MAP = {
	default: MOTION_DEFAULT,
	popover: MOTION_POPOVER,
	select: MOTION_SELECT,
	tooltip: MOTION_TOOLTIP,
} as const;

type TMotionPropMap = typeof MOTION_PROP_MAP;
type TMotionType = Exclude<keyof TMotionPropMap, 'default'>;

interface IMotionState<T extends TMotionType> {
	disableAnimation: boolean;
	motionProps: TMotionPropMap[T] | TMotionPropMap['default'];
}

export function getMotionProps<T extends TMotionType>(
	type: T
): Omit<TMotionPropMap, 'default'>[T];
export function getMotionProps<T extends TMotionType>(
	type: T,
	isHighAppearance: boolean
): TMotionPropMap[T] | TMotionPropMap['default'];
export function getMotionProps<T extends TMotionType>(
	type: T,
	isHighAppearance?: boolean
): TMotionPropMap[T] | TMotionPropMap['default'] {
	if (isHighAppearance === undefined) {
		return MOTION_PROP_MAP[type];
	}

	if (!isHighAppearance) {
		return MOTION_PROP_MAP.default;
	}

	return MOTION_PROP_MAP[type];
}

export function useMotionState<T extends TMotionType>(
	type: T
): IMotionState<T> {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();

	return useMemo(
		() =>
			isReducedMotion
				? { disableAnimation: true, motionProps: MOTION_DEFAULT }
				: {
						disableAnimation: false,
						motionProps: getMotionProps(type, isHighAppearance),
					},
		[isHighAppearance, isReducedMotion, type]
	);
}

export function useMotionProps<T extends TMotionType>(
	type: T
): IMotionState<T>['motionProps'] {
	return useMotionState(type).motionProps;
}
