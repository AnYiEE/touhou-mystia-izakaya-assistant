'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type InternalForwardRefRenderFunction} from '@nextui-org/system';
import {Switch as NextUISwitch, type SwitchProps} from '@nextui-org/switch';

interface IProps extends SwitchProps {}

export default memo(
	forwardRef<ElementRef<typeof NextUISwitch>, IProps>(function Switch({disableAnimation, ...props}, ref) {
		const isReducedMotion = useReducedMotion();

		return <NextUISwitch disableAnimation={disableAnimation ?? isReducedMotion} {...props} ref={ref} />;
	})
) as InternalForwardRefRenderFunction<'input', IProps>;

export type {IProps as ISwitchProps};
