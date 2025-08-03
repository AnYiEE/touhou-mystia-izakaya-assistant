'use client';

import { memo } from 'react';

import {
	ScrollShadow as HeroUIScrollShadow,
	type ScrollShadowProps,
} from '@heroui/scroll-shadow';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

interface IProps extends ScrollShadowProps {}

export default memo<IProps>(function ScrollShadow({
	hideScrollBar = true,
	...props
}) {
	return <HeroUIScrollShadow hideScrollBar={hideScrollBar} {...props} />;
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as IScrollShadowProps };
