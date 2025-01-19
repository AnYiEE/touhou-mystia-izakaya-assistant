'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type BadgeProps, Badge as HeroUIBadge} from '@heroui/badge';
import {type InternalForwardRefRenderFunction} from '@heroui/system';

interface IProps extends BadgeProps {}

export default memo(
	forwardRef<ElementRef<typeof HeroUIBadge>, IProps>(function Badge({disableAnimation, ...props}, ref) {
		const isReducedMotion = useReducedMotion();

		return <HeroUIBadge disableAnimation={disableAnimation ?? isReducedMotion} {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'span', IProps>;

export type {IProps as IBadgeProps};
