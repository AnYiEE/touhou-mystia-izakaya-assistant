'use client';

import { cn } from '@heroui/theme';
import { type CSSProperties, memo, useMemo } from 'react';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

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
	name,
	style,
	...props
}) {
	const { t } = useI18n(siteMessages);
	const displayName = name ?? t('site.name');
	const styleObject = useMemo(
		() => ({
			...(typeof style === 'function'
				? style(displayName, fontSize)
				: style),
			fontSize: `${fontSize}px`,
		}),
		[displayName, fontSize, style]
	);
	const baseUrlStyle = useMemo(
		() => ({
			fontSize: `${Math.min(
				(fontSize * displayName.length) / (baseUrl.length + 0.85),
				fontSize
			)}px`,
		}),
		[baseUrl.length, displayName.length, fontSize]
	);

	return (
		<div
			aria-hidden
			className={cn(
				'pointer-events-none flex h-4 min-w-0 max-w-full select-none items-center overflow-hidden font-mono font-light leading-none text-default-400',
				className
			)}
			style={styleObject}
			{...props}
		>
			<div className="min-w-0 space-y-0.5">
				<p className="truncate">{displayName}</p>
				<p className="truncate" style={baseUrlStyle}>
					https://{baseUrl}
				</p>
			</div>
		</div>
	);
});
