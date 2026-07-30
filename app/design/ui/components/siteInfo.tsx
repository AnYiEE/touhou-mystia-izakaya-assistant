'use client';

import { cn } from '@heroui/theme';
import { type CSSProperties, memo, useMemo } from 'react';

import { SITE_METADATA } from '@/shared/site/metadata';

const { name: siteName } = SITE_METADATA;

interface ISiteInfoProps extends Omit<HTMLDivElementAttributes, 'style'> {
	baseUrl: string;
	fontSize: number;
	name?: string;
	style?: CSSProperties | ((name: string, fontSize: number) => CSSProperties);
}

export default memo<ISiteInfoProps>(function SiteInfo({
	baseUrl,
	className,
	fontSize,
	name = siteName,
	style,
	...props
}) {
	const styleObject = useMemo(
		() => ({
			...(typeof style === 'function' ? style(name, fontSize) : style),
			fontSize: `${fontSize}px`,
		}),
		[fontSize, name, style]
	);

	return (
		<div
			aria-hidden
			className={cn(
				'pointer-events-none flex h-4 select-none items-center font-mono font-light leading-none text-default-400',
				className
			)}
			style={styleObject}
			{...props}
		>
			<div className="space-y-0.5">
				<p>{name}</p>
				<p
					style={{
						fontSize: `${
							(fontSize * name.length) / (baseUrl.length + 0.85)
						}px`,
					}}
				>
					https://{baseUrl}
				</p>
			</div>
		</div>
	);
});
