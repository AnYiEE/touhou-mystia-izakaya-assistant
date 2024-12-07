'use client';

import {type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {useQRCode} from 'next-qrcode';

import {type IQRCode} from 'next-qrcode/dist/useQRCode';

interface IProps extends Omit<IQRCode, 'logo'>, Pick<HTMLDivElementAttributes, 'className'> {
	type?: 'image' | 'svg';
}

export default memo<PropsWithChildren<IProps>>(function QRCode({children, className, options, text, type = 'svg'}) {
	const {Image, SVG} = useQRCode();

	const isImage = type === 'image';

	const Component = isImage ? Image : SVG;

	return (
		<div className="flex flex-col items-center">
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
});
