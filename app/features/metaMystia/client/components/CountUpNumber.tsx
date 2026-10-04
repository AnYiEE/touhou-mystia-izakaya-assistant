'use client';

import { animate, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

const COUNT_UP_DURATION_S = 1;

interface IProps {
	className?: string;
	value: number;
}

export default function CountUpNumber({ className, value }: IProps) {
	const isReducedMotion = useReducedMotion();
	const numberRef = useRef<HTMLSpanElement>(null);
	const isInView = useInView(numberRef, {
		margin: '0px 0px 10% 0px',
		once: true,
	});
	const [displayValue, setDisplayValue] = useState(value);

	useEffect(() => {
		if (isReducedMotion || !isInView) {
			return;
		}

		const controls = animate(0, value, {
			duration: COUNT_UP_DURATION_S,
			ease: 'easeOut',
			onUpdate: (latest) => {
				setDisplayValue(Math.round(latest));
			},
		});

		return () => {
			controls.stop();
		};
	}, [isInView, isReducedMotion, value]);

	return (
		<span ref={numberRef} className={className}>
			{displayValue}
		</span>
	);
}
