'use client';

import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import { Input as HeroUIInput, type InputProps } from '@heroui/input';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

import { cn } from '@/design/ui/utils';

import { globalStore as store } from '@/stores';

interface IProps extends InputProps {}

export default memo<IProps>(function Input({
	classNames,
	disableAnimation,
	...props
}) {
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<HeroUIInput
			disableAnimation={disableAnimation ?? isReducedMotion}
			classNames={{
				...classNames,
				inputWrapper: cn(
					'bg-default/40 transition-background data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default group-data-[focus=true]:group-data-[invalid=true]:!bg-danger/40 group-data-[invalid=true]:!bg-danger/20 data-[hover=true]:group-data-[invalid=true]:!bg-danger/30 motion-reduce:transition-none',
					isHighAppearance &&
						'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70',
					classNames?.inputWrapper
				),
			}}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'input', IProps>;

export type { IProps as IInputProps };
