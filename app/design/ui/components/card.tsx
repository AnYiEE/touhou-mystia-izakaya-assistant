'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type CardProps, Card as HeroUICard} from '@heroui/card';
import {type InternalForwardRefRenderFunction} from '@heroui/system';

interface IProps extends CardProps {}

export default memo(
	forwardRef<ElementRef<typeof HeroUICard>, IProps>(function Card({disableAnimation, ...props}, ref) {
		const isReducedMotion = useReducedMotion();

		return <HeroUICard disableAnimation={disableAnimation ?? isReducedMotion} {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'div', IProps>;

export type {IProps as ICardProps};
