import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Image, type ImageProps} from '@nextui-org/react';

type TDivAttributes = HTMLAttributes<HTMLDivElement>;
type TParagraphAttributes = HTMLAttributes<HTMLParagraphElement>;

interface IProps {
	alt: NonNullable<ImageProps['alt']>;
	src: NonNullable<ImageProps['src']>;
	className?: ImageProps['className'];
	classNames?: {
		descriptionClassName?: TParagraphAttributes['className'];
		wrapperClassName?: TDivAttributes['className'];
	};
}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function QRCode(
		{alt, src, className, classNames, children},
		ref
	) {
		return (
			<div className={twMerge('flex select-none flex-col items-center', classNames?.wrapperClassName)} ref={ref}>
				<Image
					isBlurred
					alt={alt}
					draggable={false}
					src={src}
					className={twMerge('h-32 dark:invert', className)}
				/>
				{children !== undefined && (
					<p className={twMerge('text-xs', classNames?.descriptionClassName)}>{children}</p>
				)}
			</div>
		);
	})
);
