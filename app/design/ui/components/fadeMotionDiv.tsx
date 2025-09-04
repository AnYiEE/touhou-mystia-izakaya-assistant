'use client';

import { type HTMLAttributes, type PropsWithChildren, memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import { AnimatePresence, type Variants, motion } from 'framer-motion';

type TVariant = 'content' | 'placeholder';

const variants = {
	content: {
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: 0 },
		initial: { opacity: 0, y: 16 },
	},
	placeholder: {
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		initial: { opacity: 0 },
	},
} as const satisfies Record<TVariant, Variants>;

interface IProps extends HTMLAttributes<HTMLDivElement> {
	target: number | string;
	variant?: TVariant;
}

export default memo<PropsWithChildren<IProps>>(function FadeMotionDiv({
	children,
	className,
	target,
	variant = 'content',
}) {
	const isReducedMotion = useReducedMotion();

	return (
		<AnimatePresence mode="popLayout">
			{children === null ||
			children === undefined ? null : isReducedMotion ? (
				<div className={className}>{children}</div>
			) : (
				<motion.div
					layout="position"
					key={target}
					animate="animate"
					exit="exit"
					initial="initial"
					transition={{
						duration: 0.15,
						ease: 'easeInOut',
						layout: { ease: 'linear' },
					}}
					variants={variants[variant]}
					className={className}
				>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
});

export type { IProps as IFadeMotionDivProps };
