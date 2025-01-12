'use client';

import {type ComponentProps, type ElementRef, forwardRef, memo} from 'react';

import {Avatar as NextUIAvatar} from '@nextui-org/avatar';
import {type InternalForwardRefRenderFunction, extendVariants} from '@nextui-org/system';

import {generateRatingVariants} from '@/design/ui/utils';

const CustomNextUIAvatar = extendVariants(NextUIAvatar, generateRatingVariants('base'));

interface IProps extends ComponentProps<typeof CustomNextUIAvatar> {}

export default memo(
	forwardRef<ElementRef<typeof CustomNextUIAvatar>, IProps>(function Avatar(props, ref) {
		return <CustomNextUIAvatar {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'span', IProps>;

export type {IProps as IAvatarProps};
