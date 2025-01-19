'use client';

import {type ComponentProps, type ElementRef, forwardRef, memo, useMemo} from 'react';

import {useMotionProps, useReducedMotion} from '@/design/ui/hooks';

import {type InternalForwardRefRenderFunction, extendVariants} from '@nextui-org/system';
import {Tooltip as NextUITooltip} from '@nextui-org/tooltip';

import {getStyleBlur} from '@/design/ui/components/popover';
import {cn, generateRatingVariants} from '@/design/ui/utils';

import {globalStore as store} from '@/stores';

const CustomNextUITooltip = extendVariants(NextUITooltip, generateRatingVariants('content'));

interface IProps extends ComponentProps<typeof CustomNextUITooltip> {
	disableBlur?: boolean;
}

type Ref = NonNullable<IProps['ref']>;

export default memo(
	forwardRef<ElementRef<typeof NextUITooltip>, IProps>(function Tooltip(
		{classNames, color, disableAnimation, disableBlur, radius, showArrow, ...props},
		ref
	) {
		const motionProps = useMotionProps('tooltip');
		const isReducedMotion = useReducedMotion();

		const isHighAppearance = store.persistence.highAppearance.use();

		const styleBlur = useMemo(
			() => getStyleBlur(color, disableBlur, isHighAppearance),
			[color, disableBlur, isHighAppearance]
		);

		return (
			<CustomNextUITooltip
				color={color}
				disableAnimation={disableAnimation ?? isReducedMotion}
				motionProps={motionProps}
				// The same radius as `Popover`.
				radius={radius ?? 'lg'}
				showArrow={isHighAppearance ? false : Boolean(showArrow)}
				classNames={{
					...classNames,
					content: cn(styleBlur, classNames?.content),
				}}
				{...props}
				ref={ref as Ref}
			/>
		);
	})
) as InternalForwardRefRenderFunction<'div', IProps>;

export type {IProps as ITooltipProps};
