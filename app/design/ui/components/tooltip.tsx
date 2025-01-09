'use client';

import {type ComponentProps, type ElementRef, forwardRef, memo, useMemo} from 'react';

import {useMotionProps} from '@/design/ui/hooks';

import {type InternalForwardRefRenderFunction, Tooltip as NextUITooltip, extendVariants} from '@nextui-org/react';

import {getStyleBlur} from '@/design/ui/components/popover';
import {cn, generateRatingVariants} from '@/design/ui/utils';

import {globalStore as store} from '@/stores';

const CustomNextUITooltip = extendVariants(NextUITooltip, generateRatingVariants('content'));

interface IProps extends ComponentProps<typeof CustomNextUITooltip> {
	disableBlur?: boolean;
}

export default memo(
	forwardRef<ElementRef<typeof NextUITooltip>, IProps>(function Tooltip(
		{classNames, color, disableBlur, radius, showArrow, ...props},
		ref
	) {
		const motionProps = useMotionProps('tooltip');

		const isHighAppearance = store.persistence.highAppearance.use();

		const styleBlur = useMemo(
			() => getStyleBlur(color, disableBlur, isHighAppearance),
			[color, disableBlur, isHighAppearance]
		);

		return (
			<CustomNextUITooltip
				color={color}
				motionProps={motionProps}
				// The same radius as `Popover`.
				radius={radius ?? 'lg'}
				showArrow={isHighAppearance ? false : Boolean(showArrow)}
				classNames={{
					...classNames,
					content: cn(styleBlur, classNames?.content),
				}}
				{...props}
				ref={ref}
			/>
		);
	})
) as InternalForwardRefRenderFunction<'div', IProps>;

export type {IProps as ITooltipProps};
