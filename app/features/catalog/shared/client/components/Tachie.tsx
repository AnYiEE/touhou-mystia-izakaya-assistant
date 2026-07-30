'use client';

import { Image, type ImageProps } from '@heroui/image';
import { cn } from '@heroui/theme';
import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

interface IProps extends Pick<
	ImageProps,
	'alt' | 'aria-hidden' | 'className' | 'src' | 'width'
> {}

export default memo<IProps>(function Tachie({
	alt,
	className,
	src,
	width,
	...props
}) {
	const isReducedMotion = useReducedMotion();

	return (
		<Image
			removeWrapper
			disableAnimation={isReducedMotion}
			draggable={false}
			alt={alt}
			src={src}
			width={width}
			aria-label={
				props['aria-hidden'] === true || props['aria-hidden'] === 'true'
					? undefined
					: `${alt}立绘`
			}
			title={alt}
			className={cn('image-rendering-pixelated select-none', className)}
		/>
	);
});
