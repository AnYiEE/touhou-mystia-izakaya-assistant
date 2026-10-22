'use client';

import { cn } from '@heroui/theme';
import { AnimatePresence, type PanInfo, motion } from 'framer-motion';
import { type PropsWithChildren, useCallback, useRef } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

const NUDGE_HIDDEN = { opacity: 0, y: 48 } as const;
const NUDGE_REDUCED_HIDDEN = { opacity: 0 } as const;
const NUDGE_TRANSITION = {
	duration: MOTION_DURATION_S.base,
	ease: MOTION_EASE.standard,
	type: 'tween',
} as const;
const NUDGE_VISIBLE = { opacity: 1, y: 0 } as const;
const NUDGE_REDUCED_VISIBLE = { opacity: 1 } as const;
const REDUCED_MOTION_TRANSITION = {
	duration: MOTION_DURATION_S.fast,
	ease: MOTION_EASE.standard,
	type: 'tween',
} as const;
const SWIPE_DISMISS_DISTANCE_PX = 72;
const SWIPE_DRAG_CONSTRAINTS = {
	bottom: 0,
	left: 0,
	right: 0,
	top: 0,
} as const;
const SWIPE_DRAG_ELASTIC = { bottom: 1, left: 1, right: 1, top: 0 } as const;

interface IProps extends PropsWithChildren {
	isVisible: boolean;
	nudgeKey: string;
	onSwipeDismiss?: () => void;
}

export default function BottomNudge({
	children,
	isVisible,
	nudgeKey,
	onSwipeDismiss,
}: IProps) {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();

	const swipeAxisRef = useRef<'x' | 'y' | null>(null);

	const handleDragStart = useCallback(() => {
		swipeAxisRef.current = null;
	}, []);

	const handleDirectionLock = useCallback((axis: 'x' | 'y') => {
		swipeAxisRef.current = axis;
	}, []);

	const handleDragEnd = useCallback(
		(_event: MouseEvent | PointerEvent | TouchEvent, info: PanInfo) => {
			if (onSwipeDismiss === undefined) {
				return;
			}

			const swipeAxis = swipeAxisRef.current;
			swipeAxisRef.current = null;
			const shouldDismiss =
				(swipeAxis === 'x' &&
					Math.abs(info.offset.x) >= SWIPE_DISMISS_DISTANCE_PX) ||
				(swipeAxis === 'y' &&
					info.offset.y >= SWIPE_DISMISS_DISTANCE_PX);

			if (shouldDismiss) {
				onSwipeDismiss();
			}
		},
		[onSwipeDismiss]
	);

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
			<AnimatePresence>
				{isVisible && (
					<motion.div
						key={nudgeKey}
						animate={
							isReducedMotion
								? NUDGE_REDUCED_VISIBLE
								: NUDGE_VISIBLE
						}
						aria-live="polite"
						className={cn(
							'pointer-events-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-large border border-default/60 px-4 py-3 shadow-large dark:border-default/30',
							isHighAppearance
								? 'backdrop-saturate-125 bg-content1/55 backdrop-blur-lg dark:bg-content1/60'
								: 'bg-content1'
						)}
						drag={onSwipeDismiss !== undefined}
						dragConstraints={SWIPE_DRAG_CONSTRAINTS}
						dragDirectionLock
						dragElastic={SWIPE_DRAG_ELASTIC}
						dragMomentum={false}
						exit={
							isReducedMotion
								? NUDGE_REDUCED_HIDDEN
								: NUDGE_HIDDEN
						}
						initial={
							isReducedMotion
								? NUDGE_REDUCED_HIDDEN
								: NUDGE_HIDDEN
						}
						role="status"
						style={{
							touchAction:
								onSwipeDismiss === undefined ? 'auto' : 'none',
						}}
						transition={
							isReducedMotion
								? REDUCED_MOTION_TRANSITION
								: NUDGE_TRANSITION
						}
						onDirectionLock={handleDirectionLock}
						onDragEnd={handleDragEnd}
						onDragStart={handleDragStart}
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
