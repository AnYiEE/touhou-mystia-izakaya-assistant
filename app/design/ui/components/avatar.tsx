'use client';

import {type ComponentProps, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {Avatar as HeroUIAvatar} from '@heroui/avatar';
import {type InternalForwardRefRenderFunction, extendVariants} from '@heroui/system';

import {generateRatingVariants} from '@/design/ui/utils';

const CustomHeroUIAvatar = extendVariants(HeroUIAvatar, generateRatingVariants('base'));

interface IProps extends ComponentProps<typeof CustomHeroUIAvatar> {}

export default memo<IProps>(function Avatar({disableAnimation, ...props}) {
	const isReducedMotion = useReducedMotion();

	return <CustomHeroUIAvatar disableAnimation={disableAnimation ?? isReducedMotion} {...props} />;
}) as InternalForwardRefRenderFunction<'span', IProps>;

export type {IProps as IAvatarProps};
