'use client';

import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import { type InternalForwardRefRenderFunction } from '@heroui/system';
import { Snippet as HeroUISnippet, type SnippetProps } from '@heroui/snippet';

interface IProps extends SnippetProps {}

export default memo<IProps>(function Snippet({
	copyButtonProps,
	disableAnimation,
	tooltipProps,
	...props
}) {
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
		/>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as ISnippetProps };
