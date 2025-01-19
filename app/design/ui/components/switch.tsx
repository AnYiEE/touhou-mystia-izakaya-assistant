'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type InternalForwardRefRenderFunction} from '@heroui/system';
import {Switch as HeroUISwitch, type SwitchProps} from '@heroui/switch';

interface IProps extends SwitchProps {}

export default memo(
	forwardRef<ElementRef<typeof HeroUISwitch>, IProps>(function Switch({disableAnimation, ...props}, ref) {
		const isReducedMotion = useReducedMotion();

		return <HeroUISwitch disableAnimation={disableAnimation ?? isReducedMotion} {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'input', IProps>;

export type {IProps as ISwitchProps};
