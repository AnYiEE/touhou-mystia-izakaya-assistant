import {type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Image, type ImageProps} from '@nextui-org/react';

interface IProps {
	alt: NonNullable<ImageProps['alt']>;
	src: NonNullable<ImageProps['src']>;
	className?: ImageProps['className'];
}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function QRCode({alt, src, className, children}, ref) {
		return (
			<div className="flex select-none flex-col items-center" ref={ref}>
				<Image
					isBlurred
					alt={alt}
					draggable={false}
					src={src}
					className={twMerge('h-32 dark:invert', className)}
				/>
				{children !== undefined && <p className="text-xs">{children}</p>}
			</div>
		);
	})
);
