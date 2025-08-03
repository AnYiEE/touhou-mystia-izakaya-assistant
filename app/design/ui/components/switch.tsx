'use client';

import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import { type InternalForwardRefRenderFunction } from '@heroui/system';
import { Switch as HeroUISwitch, type SwitchProps } from '@heroui/switch';

interface IProps extends SwitchProps {}

export default memo<IProps>(function Switch({ disableAnimation, ...props }) {
	const isReducedMotion = useReducedMotion();

	return (
		<HeroUISwitch
			disableAnimation={disableAnimation ?? isReducedMotion}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'input', IProps>;

export type { IProps as ISwitchProps };
