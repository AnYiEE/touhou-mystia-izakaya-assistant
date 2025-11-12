import { type PropsWithChildren } from 'react';
import { type Metadata, type Viewport } from 'next';
import { Noto_Sans, Noto_Sans_Mono, Noto_Sans_SC } from 'next/font/google';
import Script from 'next/script';
import { execSync } from 'node:child_process';

import { ThemeScript } from '@/design/hooks';
import { cn } from '@/design/ui/components';

import Polyfills from '@/polyfills';
import Providers, { AddHighAppearance } from '@/providers';
import Footer from '@/(pages)/(layout)/footer';
import Navbar from '@/(pages)/(layout)/navbar';
import Analytics from '@/components/analytics';
import ErrorBoundary from '@/components/errorBoundary';

import { config as fontawesomeConfig } from '@fortawesome/fontawesome-svg-core';
import { siteConfig } from '@/configs';

import './globals.scss';
import 'driver.js/dist/driver.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

/** @see {@link https://docs.fontawesome.com/web/use-with/react/use-with#getting-font-awesome-css-to-work} */
fontawesomeConfig.autoAddCss = false;

const {
	author,
	cdnUrl,
	description,
	enName,
	isAnalytics,
	isOffline,
	isProduction,
	keywords,
	locale,
	name,
	shortName,
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

	authors: author,
	icons: {
		apple: `${cdnUrl}/icons/apple-touch-icon.png`,
		icon: `${cdnUrl}/favicon.ico`,
	},

	...(isOffline
		? {}
		: {
				twitter: { card: 'summary' },
				verification: {
					other: {
						// cSpell:ignore codeva
						'baidu-site-verification': 'codeva-aSffMaEHAj',
					},
				},
			}),
};

export const viewport: Viewport = { viewportFit: 'cover' };

const sha = (() => {
	if (vercelSha) {
		return vercelSha.slice(0, 7);
	}

	try {
		return execSync('git rev-parse --short HEAD')
			.toString('utf8')
			.trim()
			.slice(0, 7);
	} catch {
		return 'unknown';
	}
})();

const notoSans = Noto_Sans({
	subsets: ['latin'],
	variable: '--font-noto-sans',
	weight: 'variable',
});

const notoSansMono = Noto_Sans_Mono({
	subsets: ['latin'],
	variable: '--font-noto-sans-mono',
	weight: 'variable',
});

const notoSansSC = Noto_Sans_SC({
	subsets: ['latin'],
	variable: '--font-noto-sans-sc',
	weight: 'variable',
});

interface IProps {}

export default function RootLayout({ children }: PropsWithChildren<IProps>) {
	return (
		<html
			suppressHydrationWarning
			lang={locale}
			className={cn(
				notoSans.variable,
				notoSansMono.variable,
				notoSansSC.variable,
				'selection-custom light:izakaya dark:izakaya-dark'
			)}
		>
			<head>
				<Polyfills />
				<ThemeScript />
				{
					// Register service worker. The `sha` is the commit SHA of the current commit, used to bypass browser caching.
					isProduction && !isOffline && (
						<Script
							async
							src={`/registerServiceWorker.js?v=${sha}`}
						/>
					)
				}
			</head>
			<body
				suppressHydrationWarning
				className="text-autospace antialiased"
			>
				<AddHighAppearance />
				<ErrorBoundary>
					<Providers locale={locale}>
						<div className="flex min-h-dvh-safe flex-col">
							<Navbar />
							<main className="container mx-auto grid max-w-7xl grow px-6 py-8 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl">
								<div id="modal-portal-container" />
								{children}
							</main>
							<Footer />
						</div>
					</Providers>
					{isProduction && isAnalytics && <Analytics />}
				</ErrorBoundary>
			</body>
		</html>
	);
}
