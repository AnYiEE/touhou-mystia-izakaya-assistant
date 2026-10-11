'use client';

import { cn } from '@heroui/theme';
import { type CSSProperties, memo, useMemo } from 'react';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { type TLocale } from '@/shared/i18n/locale';
import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

interface ISiteInfoProps extends Omit<HTMLDivElementAttributes, 'style'> {
	baseUrl: string;
	fontSize: number;
	/**
	 * @description Optional cap of the URL line size as a fraction of
	 * `fontSize`. Omitted, the URL is only shrunk to match the name width.
	 */
	maxUrlFontScale?: number;
	name?: string;
	style?: CSSProperties | ((name: string, fontSize: number) => CSSProperties);
}

/** Hangul names are wider per character than the plain length ratio assumes. */
const URL_LENGTH_PADDING_BY_LOCALE: Readonly<Partial<Record<TLocale, number>>> =
	{ ko: 2.5 };
const DEFAULT_URL_LENGTH_PADDING = 0.85;

/** Configured origin scheme, so the line stays server-renderable. */
const BASE_URL_PROTOCOL = new URL(PUBLIC_RUNTIME_CONFIG.baseOrigin).protocol;

export default memo<ISiteInfoProps>(function SiteInfo({
	baseUrl,
	className,
	fontSize,
	maxUrlFontScale,
	name,
	style,
	...props
}) {
	const { locale, t } = useI18n(siteMessages);

	const displayName = name ?? t('site.name');
	const urlLengthPadding =
		URL_LENGTH_PADDING_BY_LOCALE[locale] ?? DEFAULT_URL_LENGTH_PADDING;

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
				(fontSize * displayName.length) /
					(baseUrl.length + urlLengthPadding),
				fontSize * (maxUrlFontScale ?? 1)
			)}px`,
		}),
		[
			baseUrl.length,
			displayName.length,
			fontSize,
			maxUrlFontScale,
			urlLengthPadding,
		]
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
					{`${BASE_URL_PROTOCOL}//${baseUrl}`}
				</p>
			</div>
		</div>
	);
});
