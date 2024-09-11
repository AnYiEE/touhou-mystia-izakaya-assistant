'use client';

import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {useQRCode} from 'next-qrcode';

import {type IQRCode} from 'next-qrcode/dist/useQRCode';

interface IProps extends Omit<IQRCode, 'logo'>, Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function QRCode(
		{options, text, className, children},
		ref
	) {
		const {SVG} = useQRCode();

		return (
			<div ref={ref} className="flex flex-col items-center">
				<div aria-hidden className={twMerge('w-32 dark:invert', className)}>
					<SVG
						options={{
							color: {
								dark: '#000000ff',
								light: '#ffffff00',
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
