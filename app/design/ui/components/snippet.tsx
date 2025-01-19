'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {type InternalForwardRefRenderFunction} from '@nextui-org/system';
import {Snippet as NextUISnippet, type SnippetProps} from '@nextui-org/snippet';

interface IProps extends SnippetProps {}

export default memo(
	forwardRef<ElementRef<typeof NextUISnippet>, IProps>(function Snippet(
		{copyButtonProps, disableAnimation, tooltipProps, ...props},
		ref
	) {
		const isReducedMotion = useReducedMotion();

		return (
			<NextUISnippet
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
