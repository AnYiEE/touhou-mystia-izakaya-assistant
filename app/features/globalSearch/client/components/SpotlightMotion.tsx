'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { type PropsWithChildren, memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

import {
	SPOTLIGHT_BLOCK_VARIANTS,
	SPOTLIGHT_CONTENT_TRANSITION,
	SPOTLIGHT_PREVIEW_VARIANTS,
} from './motion';

interface IMotionBlockProps extends PropsWithChildren<object> {
	className?: string;
	motionKey: number | string;
}

export const SpotlightMotionBlock = memo<IMotionBlockProps>(
	function SpotlightMotionBlock({ children, className, motionKey }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className={className}>{children}</div>;
		}
		return (
			<motion.div
				layout="position"
				key={motionKey}
				animate="animate"
				exit="exit"
				initial="initial"
				transition={SPOTLIGHT_CONTENT_TRANSITION}
				variants={SPOTLIGHT_BLOCK_VARIANTS}
				className={className}
			>
				{children}
			</motion.div>
		);
	}
);

export const SpotlightPreviewMotion = memo<IMotionBlockProps>(
	function SpotlightPreviewMotion({ children, className, motionKey }) {
		const isReducedMotion = useReducedMotion();

		if (isReducedMotion) {
			return <div className={className}>{children}</div>;
		}
		return (
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.div
					layout="position"
					key={motionKey}
					animate="animate"
					exit="exit"
					initial="initial"
					transition={SPOTLIGHT_CONTENT_TRANSITION}
					variants={SPOTLIGHT_PREVIEW_VARIANTS}
					className={className}
				>
					{children}
				</motion.div>
			</AnimatePresence>
		);
	}
);
