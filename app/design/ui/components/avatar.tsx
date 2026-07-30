'use client';

import { Avatar as HeroUIAvatar } from '@heroui/avatar';
import {
	type InternalForwardRefRenderFunction,
	extendVariants,
} from '@heroui/system';
import { type ComponentProps, memo } from 'react';

import { createRatingVariants } from '@/design/theme/styles/rating/createRatingVariants';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

const CustomHeroUIAvatar = extendVariants(
	HeroUIAvatar,
	createRatingVariants('base')
);

interface IProps extends ComponentProps<typeof CustomHeroUIAvatar> {}

export default memo<IProps>(function Avatar({ disableAnimation, ...props }) {
	const isReducedMotion = useReducedMotion();

	return (
		<CustomHeroUIAvatar
			disableAnimation={disableAnimation ?? isReducedMotion}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'span', IProps>;

export type { IProps as IAvatarProps };
