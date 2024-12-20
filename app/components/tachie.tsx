'use client';

import {memo} from 'react';

import {Image, type ImageProps, cn} from '@nextui-org/react';

interface IProps extends Pick<ImageProps, 'alt' | 'aria-hidden' | 'className' | 'src' | 'width'> {}

export default memo<IProps>(function Tachie({alt, className, src, width, ...props}) {
	return (
		<Image
			removeWrapper
			draggable={false}
			alt={alt}
			src={src}
			width={width}
			aria-label={props['aria-hidden'] ? undefined : `${alt}立绘`}
			title={alt}
			className={cn('select-none', className)}
		/>
	);
});
