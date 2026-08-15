'use client';

import { Snippet as HeroUISnippet, type SnippetProps } from '@heroui/snippet';
import { type InternalForwardRefRenderFunction } from '@heroui/system';
import { memo, useMemo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

interface IProps extends SnippetProps {}

export default memo<IProps>(function Snippet({
	copyButtonProps,
	disableAnimation,
	tooltipProps,
	...props
}) {
	const isReducedMotion = useReducedMotion();

	const resolvedCopyButtonProps = useMemo(
		() => ({ disableAnimation: isReducedMotion, ...copyButtonProps }),
		[copyButtonProps, isReducedMotion]
	);
	const resolvedTooltipProps = useMemo(
		() => ({ disableAnimation: isReducedMotion, ...tooltipProps }),
		[isReducedMotion, tooltipProps]
	);

	return (
		<HeroUISnippet
			copyButtonProps={resolvedCopyButtonProps}
			disableAnimation={disableAnimation ?? isReducedMotion}
			tooltipProps={resolvedTooltipProps}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as ISnippetProps };
