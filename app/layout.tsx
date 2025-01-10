import {type ReactNode} from 'react';
import {type Metadata, type Viewport} from 'next';
import Script from 'next/script';
import {execSync} from 'node:child_process';

import Footer from '@/(pages)/footer';
import Navbar from '@/(pages)/navbar';
import Analytics from '@/components/analytics';
import ErrorBoundary from '@/components/errorBoundary';
import Polyfills from '@/polyfills';
import Providers, {AddBodyClassName} from '@/providers';
import {ThemeScript} from '@/design/hooks';

import {config as fontawesomeConfig} from '@fortawesome/fontawesome-svg-core';
import {siteConfig} from '@/configs';

import './globals.scss';
import 'driver.js/dist/driver.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

/** @see {@link https://docs.fontawesome.com/web/use-with/react/use-with#getting-font-awesome-css-to-work} */
fontawesomeConfig.autoAddCss = false;

const {author, cdnUrl, description, enName, isAnalytics, isProduction, keywords, locale, name, shortName, vercelSha} =
	siteConfig;

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

const sha = (() => {
	let _sha: string;

	if (vercelSha) {
		_sha = vercelSha.slice(0, 7);
	}

	try {
		_sha = execSync('git rev-parse --short HEAD').toString('utf8');
	} catch {
		_sha = 'unknown';
	}

	return _sha.trim();
})();

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html suppressHydrationWarning lang={locale} className="selection-custom light:izakaya dark:izakaya-dark">
			<head>
				<Polyfills />
				<ThemeScript />
				{
					// Register service worker. The `sha` is the commit SHA of the current commit, used to bypass browser caching.
					isProduction && <Script async src={`/registerServiceWorker.js?v=${sha}`} />
				}
				<Script async src={`${cdnUrl}/SmoothScroll.min.js`} />
			</head>
			<body suppressHydrationWarning className="antialiased">
				<AddBodyClassName />
				<ErrorBoundary>
					<Providers locale={locale}>
						<div className="flex min-h-dvh-safe flex-col">
							<Navbar />
							<main className="container mx-auto grid max-w-7xl flex-grow px-6 py-8">
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
