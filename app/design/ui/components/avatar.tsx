'use client';

import {type ComponentProps, type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {Avatar as HeroUIAvatar} from '@heroui/avatar';
import {type InternalForwardRefRenderFunction, extendVariants} from '@heroui/system';

import {generateRatingVariants} from '@/design/ui/utils';

const CustomHeroUIAvatar = extendVariants(HeroUIAvatar, generateRatingVariants('base'));

interface IProps extends ComponentProps<typeof CustomHeroUIAvatar> {}

export default memo(
	forwardRef<ElementRef<typeof CustomHeroUIAvatar>, IProps>(function Avatar({disableAnimation, ...props}, ref) {
		const isReducedMotion = useReducedMotion();

		return <CustomHeroUIAvatar disableAnimation={disableAnimation ?? isReducedMotion} {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'span', IProps>;

export type {IProps as IAvatarProps};
