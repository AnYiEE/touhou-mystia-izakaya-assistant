'use client';

import {type PropsWithChildren, memo} from 'react';

import {useQRCode} from 'next-qrcode';

import {cn} from '@/design/ui/components';

import {type IQRCode} from 'next-qrcode/dist/useQRCode';

interface IProps extends Omit<IQRCode, 'logo'>, Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function QRCode({children, className, options, text}) {
	const {SVG} = useQRCode();

	return (
		<div className="flex flex-col items-center">
			<div aria-hidden className={cn('w-32 dark:invert', className)}>
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
			{children !== undefined && <p className="text-center text-tiny">{children}</p>}
		</div>
	);
});
