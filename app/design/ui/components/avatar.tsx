'use client';

import {type ComponentProps, type ElementRef, forwardRef, memo} from 'react';

import {type InternalForwardRefRenderFunction, Avatar as NextUIAvatar, extendVariants} from '@nextui-org/react';

import {generateRatingVariants} from '@/design/ui/utils';

const CustomNextUIAvatar = extendVariants(NextUIAvatar, generateRatingVariants('base'));

interface IProps extends ComponentProps<typeof CustomNextUIAvatar> {}

export default memo(
	forwardRef<ElementRef<typeof CustomNextUIAvatar>, IProps>(function Avatar(props, ref) {
		return <CustomNextUIAvatar {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'span', IProps>;

export type {IProps as IAvatarProps};
