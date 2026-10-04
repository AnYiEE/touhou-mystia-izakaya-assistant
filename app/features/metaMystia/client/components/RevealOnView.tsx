'use client';

import { cn } from '@heroui/theme';
import { motion } from 'framer-motion';
import { type PropsWithChildren } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';
import { MOTION_DURATION_S, MOTION_EASE } from '@/design/ui/motion';

interface IProps {
	className?: string;
	delay?: number;
}

export default function RevealOnView({
	children,
	className,
	delay = 0,
}: PropsWithChildren<IProps>) {
	const isReducedMotion = useReducedMotion();

	if (isReducedMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			transition={{
				delay,
				duration: MOTION_DURATION_S.slow,
				ease: MOTION_EASE.enter,
			}}
			viewport={{ amount: 0.1, margin: '0px 0px 10% 0px', once: true }}
			whileInView={{ opacity: 1, y: 0 }}
			className={cn('meta-mystia-reveal', className)}
		>
			{children}
		</motion.div>
	);
}
