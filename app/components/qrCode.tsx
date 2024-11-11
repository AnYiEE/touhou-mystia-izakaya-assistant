'use client';

import {type ElementRef, type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {useQRCode} from 'next-qrcode';

import {type IQRCode} from 'next-qrcode/dist/useQRCode';

interface IProps extends Omit<IQRCode, 'logo'>, Pick<HTMLAttributes<HTMLDivElement>, 'className'> {
	type?: 'image' | 'svg';
}

export default memo(
	forwardRef<ElementRef<'div'>, PropsWithChildren<IProps>>(function QRCode(
		{children, className, options, text, type = 'svg'},
		ref
	) {
		const {Image, SVG} = useQRCode();

		const isImage = type === 'image';

		const Component = isImage ? Image : SVG;

		return (
			<div ref={ref} className="flex flex-col items-center">
				<div aria-hidden className={twMerge('w-32 dark:invert', className)}>
					<Component
						options={{
							color: {
								dark: isImage ? '' : '#000000ff',
								light: isImage ? '' : '#ffffff00',
								...options?.color,
							},
							errorCorrectionLevel: 'L',
							margin: 1.5,
							scale: 1,
							...options,
						}}
						text={text}
					/>
				</div>
				{children !== undefined && <p className="text-center text-xs">{children}</p>}
			</div>
		);
	})
);
