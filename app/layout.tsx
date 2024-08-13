import {type ReactNode} from 'react';
import {type Metadata, type Viewport} from 'next';
import Script from 'next/script';
import {execSync} from 'node:child_process';

import {SpeedInsights} from '@vercel/speed-insights/next';

import Navbar from '@/(pages)/navbar';
import Footer from '@/(pages)/footer';
import Analytics from '@/components/analytics';
import ErrorBoundary from '@/components/errorBoundary';
import Providers from '@/providers';

import {siteConfig} from '@/configs';

import 'driver.js/dist/driver.css';
import './globals.scss';

import {config as fontawesomeConfig} from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

fontawesomeConfig.autoAddCss = false;

const {author, description, keywords, locale, name, shortName, isHosted, isVercel, nodeEnv} = siteConfig;

export const metadata: Metadata = {
	title: {
		default: name,
		template: `%s - ${name}`,
	},

	description,
	keywords,

	appleWebApp: true,
	applicationName: shortName,
	manifest: '/manifest.json',

	authors: author,
	icons: {
		apple: '/icons/apple-touch-icon.png',
		icon: '/favicon.ico',
	},

	twitter: {
		card: 'summary',
	},

	other: {
		// cSpell:ignore codeva
		'baidu-site-verification': 'codeva-aSffMaEHAj',
	},
};

export const viewport: Viewport = {
	viewportFit: 'cover',
};

const isProduction = nodeEnv === 'production';
const sha = (
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? execSync('git rev-parse --short HEAD').toString('utf8')
).trim();

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html lang={locale} suppressHydrationWarning className="light:izakaya">
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
	document.head.append(metaDark);
	document.head.append(metaLight);
})();`,
					}}
				/>
				{isProduction && <Script async src={`/registerServiceWorker.js?v=${sha}`} />}
				<Script
					async
					src="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/smoothscroll/1.4.10/SmoothScroll.min.js"
				/>
			</head>
			<body className="min-h-screen bg-background font-sans font-normal text-default-900 antialiased">
				<ErrorBoundary>
					<Providers locale={locale} themeProps={{attribute: 'class'}}>
						<div className="relative flex h-screen flex-col">
							<Navbar />
							<main className="container mx-auto max-w-7xl flex-grow px-6 py-8">{children}</main>
							<Footer />
						</div>
					</Providers>
					{isProduction && isHosted && !isVercel && <Analytics />}
					{isProduction && isVercel && (
						<>
							<Analytics />
							<SpeedInsights />
						</>
					)}
				</ErrorBoundary>
			</body>
		</html>
	);
}
