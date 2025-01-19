'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type BadgeProps, Badge as NextUIBadge} from '@nextui-org/badge';
import {type InternalForwardRefRenderFunction} from '@nextui-org/system';

interface IProps extends BadgeProps {}

export default memo(
	forwardRef<ElementRef<typeof NextUIBadge>, IProps>(function Badge({disableAnimation, ...props}, ref) {
		const isReducedMotion = useReducedMotion();

		return <NextUIBadge disableAnimation={disableAnimation ?? isReducedMotion} {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'span', IProps>;

export type {IProps as IBadgeProps};
