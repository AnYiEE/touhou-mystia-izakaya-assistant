import {type ReactNode} from 'react';
import {type Metadata, type Viewport} from 'next';
import Script from 'next/script';
import {execSync} from 'node:child_process';

import {SpeedInsights} from '@vercel/speed-insights/next';

import Footer from '@/(pages)/footer';
import Navbar from '@/(pages)/navbar';
import Analytics from '@/components/analytics';
import ErrorBoundary from '@/components/errorBoundary';
import Providers from '@/providers';

import {config as fontawesomeConfig} from '@fortawesome/fontawesome-svg-core';
import {siteConfig} from '@/configs';

import './globals.scss';
import 'driver.js/dist/driver.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

/** @see {@link https://docs.fontawesome.com/web/use-with/react/use-with#getting-font-awesome-css-to-work} */
fontawesomeConfig.autoAddCss = false;

const {
	author,
	description,
	keywords,
	locale,
	name,
	enName,
	shortName,
	cdnUrl,
	isAnalytics,
	isProduction,
	isVercel,
	vercelSha,
} = siteConfig;

export const metadata: Metadata = {
	title: {
		default: `${name} - ${enName}`,
		template: `%s | ${name} - ${enName}`,
	},

	description,
	keywords,

	appleWebApp: true,
	applicationName: shortName,
	manifest: '/manifest.json',

	authors: author,
	icons: {
		apple: `${cdnUrl}/icons/apple-touch-icon.png`,
		icon: `${cdnUrl}/favicon.ico`,
	},

	twitter: {
		card: 'summary',
	},

	verification: {
		other: {
			// cSpell:ignore codeva
			'baidu-site-verification': 'codeva-aSffMaEHAj',
		},
	},

	other: {
		'mobile-web-app-capable': 'yes',
	},
};

export const viewport: Viewport = {
	viewportFit: 'cover',
};

const sha = (vercelSha?.slice(0, 7) ?? execSync('git rev-parse --short HEAD').toString('utf8')).trim();

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html suppressHydrationWarning lang={locale} className="light:izakaya">
			<head>
				<script
					dangerouslySetInnerHTML={{
						/**
						 * @description Add `globalThis` polyfill for Chrome < 71.
						 * @see {@link https://mathiasbynens.be/notes/globalthis}
						 */
						__html: `if (typeof globalThis !== 'object') {
	Object.prototype.__defineGetter__('__magic__', function () {
		return this;
	});
	__magic__.globalThis = __magic__;
	delete Object.prototype.__magic__;
}`,
					}}
				/>
				<script
					dangerouslySetInnerHTML={{
						/**
						 * @description Add `queueMicrotask` polyfill for Chrome < 71.
						 */
						__html: `if (typeof queueMicrotask !== 'function') {
	const promise = Promise.resolve();
	globalThis.queueMicrotask = (callback) => {
		promise.then(callback).catch((error) => {
			setTimeout(() => {
				throw error;
			}, 0);
		});
	};
}`,
					}}
				/>
				<script
					dangerouslySetInnerHTML={{
						/**
						 * @description Add `theme-color` meta tag.
						 * @see /app/components/themeSwitcher.tsx
						 */
						__html: `(() => {
	const colorDark = '#000';
	const colorLight = '#fef7e4';
	const customAttribute = 'default-content';
	const metaName = 'theme-color';
	let theme = 'system';
	try {
		theme = localStorage.getItem('theme');
	} catch (e) {}
	const isDark = theme === 'dark';
	const isLight = theme === 'light';
	const metaDark = document.createElement('meta');
	metaDark.name = metaName;
	metaDark.media = '(prefers-color-scheme: dark)';
	metaDark.setAttribute(customAttribute, colorDark);
	const metaLight = document.createElement('meta');
	metaLight.name = metaName;
	metaLight.media = '(prefers-color-scheme: light)';
	metaLight.setAttribute(customAttribute, colorLight);
	if (isDark || isLight) {
		const color = isDark ? colorDark : colorLight;
		metaDark.content = color;
		metaLight.content = color;
	} else {
		metaDark.content = colorDark;
		metaLight.content = colorLight;
	}
	document.head.append(metaDark, metaLight);
})();`,
					}}
				/>
				{
					// Register service worker. The `sha` is the commit SHA of the current commit, used to bypass browser caching.
					isProduction && <Script async src={`/registerServiceWorker.js?v=${sha}`} />
				}
				<Script async src={`${cdnUrl}/SmoothScroll.min.js`} />
			</head>
			<body suppressHydrationWarning className="antialiased">
				<script
					dangerouslySetInnerHTML={{
						/**
						 * @description Add `bg-blend-mystia-pseudo` class to body if the `globalStorage.highAppearance` setting is enabled.
						 * @see /app/providers.tsx
						 */
						__html: `(() => {
	let enable;
	try {
		const globalStorage = localStorage.getItem('global-storage');
		if (globalStorage) {
			enable = JSON.parse(globalStorage).state.persistence.highAppearance;
		}
	} catch (e) {}
	if (enable !== false) {
		document.body.classList.add('bg-blend-mystia-pseudo');
	}
})();`,
					}}
				/>
				<ErrorBoundary>
					<Providers locale={locale} themeProps={{attribute: 'class'}}>
						<div className="flex min-h-dvh-safe flex-col">
							<Navbar />
							<main className="container mx-auto grid max-w-7xl flex-grow px-6 py-8">{children}</main>
							<Footer />
						</div>
					</Providers>
					{isProduction && isAnalytics && <Analytics />}
					{isProduction && isVercel && <SpeedInsights />}
				</ErrorBoundary>
			</body>
		</html>
	);
}
