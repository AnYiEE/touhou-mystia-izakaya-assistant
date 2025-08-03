'use client';

import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import { type CardProps, Card as HeroUICard } from '@heroui/card';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

interface IProps extends CardProps {}

export default memo<IProps>(function Card({ disableAnimation, ...props }) {
	const isReducedMotion = useReducedMotion();

	return (
		<HeroUICard
			disableAnimation={disableAnimation ?? isReducedMotion}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as ICardProps };
