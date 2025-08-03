'use client';

import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import { type BadgeProps, Badge as HeroUIBadge } from '@heroui/badge';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

interface IProps extends BadgeProps {}

export default memo<IProps>(function Badge({ disableAnimation, ...props }) {
	const isReducedMotion = useReducedMotion();

	return (
		<HeroUIBadge
			disableAnimation={disableAnimation ?? isReducedMotion}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'span', IProps>;

export type { IProps as IBadgeProps };
