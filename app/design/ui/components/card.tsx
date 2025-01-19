'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type CardProps, Card as NextUICard} from '@nextui-org/card';
import {type InternalForwardRefRenderFunction} from '@nextui-org/system';

interface IProps extends CardProps {}

export default memo(
	forwardRef<ElementRef<typeof NextUICard>, IProps>(function Card({disableAnimation, ...props}, ref) {
		const isReducedMotion = useReducedMotion();

		return <NextUICard disableAnimation={disableAnimation ?? isReducedMotion} {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'div', IProps>;

export type {IProps as ICardProps};
