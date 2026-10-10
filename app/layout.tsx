import './infrastructure/runtime/serverPolyfills';

import { config as fontawesomeConfig } from '@fortawesome/fontawesome-svg-core';
import { type Metadata, type Viewport } from 'next';
import Script from 'next/script';
import { execSync } from 'node:child_process';
import { type PropsWithChildren } from 'react';

import ThemeScript from './design/theme/runtime/themeScript';
import { AnalyticsClient } from './features/analytics/client';
import AnnouncementBar from './features/announcements/server/AnnouncementBar';
import ErrorBoundary from './features/appShell/client/components/ErrorBoundary';
import Navbar from './features/appShell/client/components/navbar/Navbar';
import {
	buildRootMetadata,
	readMetadataLocaleContext,
} from './features/appShell/seo/pageMetadata';
import Footer from './features/appShell/server/Footer';
import LocaleScript from './features/preferences/client/localeScript';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import Polyfills from './polyfills';
import Providers, { AddHighAppearance } from './providers';
import { translate } from './shared/i18n/messages';
import { siteMessages } from './shared/site/messages';

import './globals.scss';
import './assets/fonts/index.css';
import 'driver.js/dist/driver.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

/** @see {@link https://docs.fontawesome.com/web/use-with/react/use-with#getting-font-awesome-css-to-work} */
fontawesomeConfig.autoAddCss = false;

const {
	isAccountFeatureClientEnabled,
	isAnalytics,
	isOffline,
	isProduction,
	vercelSha,
} = PUBLIC_RUNTIME_CONFIG;

export async function generateMetadata(): Promise<Metadata> {
	const { locale } = await readMetadataLocaleContext();

	return buildRootMetadata(locale);
}

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

interface IProps {}

async function readRootAccountFeatureInitialData() {
	if (!isAccountFeatureClientEnabled) {
		return null;
	}

	const initialDataModule =
		await import('./features/account/server/rootInitialData');

	return initialDataModule.readAccountFeatureInitialData('/');
}

export default async function RootLayout({
	children,
}: PropsWithChildren<IProps>) {
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const runtimeErrorTemplate = translate(
		siteMessages,
		locale,
		'site.runtime.errorTemplate'
	);
	const runtimeStorageWarning = translate(
		siteMessages,
		locale,
		'site.runtime.storageWarning'
	);
	const accountFeatureInitialData = await readRootAccountFeatureInitialData();
	const accountInitialData =
		accountFeatureInitialData === null
			? null
			: {
					account: accountFeatureInitialData.account,
					sessions: accountFeatureInitialData.sessions,
					ssoGrants: accountFeatureInitialData.ssoGrants,
					webauthn: accountFeatureInitialData.webauthn,
				};

	return (
		<html
			suppressHydrationWarning
			lang={locale}
			data-route-locale={isPrefixed ? locale : undefined}
			className="selection-custom"
		>
			<head>
				<Polyfills
					errorTemplate={runtimeErrorTemplate}
					storageWarning={runtimeStorageWarning}
				/>
				<ThemeScript />
				<LocaleScript />
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
					<Providers
						accountInitialData={accountInitialData}
						locale={locale}
						routeLocale={isPrefixed ? locale : null}
					>
						<div className="flex min-h-dvh-safe flex-col">
							<AnnouncementBar
								viewer={
									accountFeatureInitialData?.viewer ?? null
								}
							/>
							<Navbar />
							<main className="container mx-auto grid max-w-7xl grow grid-cols-1 px-6 py-8 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl [&>*]:min-w-0">
								<div id="modal-portal-container" />
								{children}
							</main>
							<Footer />
						</div>
					</Providers>
					{isProduction && isAnalytics && <AnalyticsClient />}
				</ErrorBoundary>
			</body>
		</html>
	);
}
