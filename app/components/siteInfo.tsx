'use client';

import { type CSSProperties, memo, useMemo } from 'react';

import { cn } from '@/design/ui/components';

import { siteConfig } from '@/configs';
import type { ISiteConfig } from '@/configs/site/types';

const { baseURL, name: siteName } = siteConfig;

interface ISiteInfoProps
	extends Omit<HTMLDivElementAttributes, 'style'>,
		Partial<Pick<ISiteConfig, 'name'>> {
	fontSize: number;
	style?: CSSProperties | ((name: string, fontSize: number) => CSSProperties);
}

export default memo<ISiteInfoProps>(function SiteInfo({
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
							(fontSize * name.length) / (baseURL.length + 0.85)
						}px`,
					}}
				>
					https://{baseURL}
				</p>
			</div>
		</div>
	);
});
