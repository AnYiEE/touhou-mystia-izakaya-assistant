'use client';

import { Input as HeroUIInput, type InputProps } from '@heroui/input';
import { type InternalForwardRefRenderFunction } from '@heroui/system';
import { cn } from '@heroui/theme';
import { memo, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

interface IProps extends InputProps {}

export default memo<IProps>(function Input({
	classNames,
	disableAnimation,
	...props
}) {
	const { isHighAppearance } = useDesignPreferences();
	const isReducedMotion = useReducedMotion();

	const mergedClassNames = useMemo(
		() => ({
			...classNames,
			inputWrapper: cn(
				'bg-default/40 transition-background data-[hover=true]:bg-default-200 group-data-[focus=true]:bg-default group-data-[focus=true]:group-data-[invalid=true]:!bg-danger/40 group-data-[invalid=true]:!bg-danger/20 data-[hover=true]:group-data-[invalid=true]:!bg-danger/30 motion-reduce:transition-none',
				isHighAppearance &&
					'bg-default/40 backdrop-blur data-[hover=true]:bg-default-400/40 group-data-[focus=true]:bg-default/70',
				classNames?.inputWrapper
			),
		}),
		[classNames, isHighAppearance]
	);

	return (
		<HeroUIInput
			disableAnimation={disableAnimation ?? isReducedMotion}
			classNames={mergedClassNames}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'input', IProps>;

export type { IProps as IInputProps };
