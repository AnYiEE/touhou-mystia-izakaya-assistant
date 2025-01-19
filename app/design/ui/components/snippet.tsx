'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type InternalForwardRefRenderFunction} from '@heroui/system';
import {Snippet as HeroUISnippet, type SnippetProps} from '@heroui/snippet';

interface IProps extends SnippetProps {}

export default memo(
	forwardRef<ElementRef<typeof HeroUISnippet>, IProps>(function Snippet(
		{copyButtonProps, disableAnimation, tooltipProps, ...props},
		ref
	) {
		const isReducedMotion = useReducedMotion();

		return (
			<HeroUISnippet
				copyButtonProps={{
					disableAnimation: isReducedMotion,
					...copyButtonProps,
				}}
				disableAnimation={disableAnimation ?? isReducedMotion}
				tooltipProps={{
					disableAnimation: isReducedMotion,
					...tooltipProps,
				}}
				{...props}
				ref={ref}
			/>
		);
	})
) as InternalForwardRefRenderFunction<'div', IProps>;

export type {IProps as ISnippetProps};
